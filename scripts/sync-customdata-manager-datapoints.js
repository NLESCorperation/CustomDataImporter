#!/usr/bin/env node

const fs = require('node:fs');
const path = require('node:path');

const importerRoot = path.resolve(__dirname, '..');
const defaultManagerRoot = path.resolve(importerRoot, '..', 'CustomDataManager');
const args = new Set(process.argv.slice(2));
const checkOnly = args.has('--check');
const managerRootArg = process.argv.find(arg => arg.startsWith('--manager-root='));
const managerRoot = managerRootArg
    ? path.resolve(managerRootArg.slice('--manager-root='.length))
    : defaultManagerRoot;

const predefinedPath = path.join(importerRoot, 'src', 'modules', 'predefined.js');
const datapointsReferencePath = path.join(importerRoot, 'PREDEFINED_DATAPOINTS_LIST.md');
const xsightPath = path.join(importerRoot, 'src', 'modules', 'xsight.js');
const registryPath = path.join(
    managerRoot,
    'app',
    'src',
    'main',
    'java',
    'customdatamanager',
    'soti',
    'mobicontrol',
    'data',
    'ProviderRegistry.kt'
);
const dataDir = path.dirname(registryPath);

function fail(message) {
    console.error(message);
    process.exit(1);
}

function readFile(filePath) {
    try {
        return fs.readFileSync(filePath, 'utf8');
    } catch (error) {
        fail(`Unable to read ${filePath}: ${error.message}`);
    }
}

function listKotlinFiles(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    return entries
        .filter(entry => entry.isFile() && entry.name.endsWith('.kt'))
        .map(entry => path.join(dir, entry.name));
}

function stripComments(source) {
    return source
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .replace(/\/\/.*$/gm, '');
}

function extractRegistryItems(source) {
    const listStart = source.indexOf('listOf(');
    if (listStart === -1) fail('ProviderRegistry.kt does not contain listOf(...).');

    let depth = 0;
    let bodyStart = -1;
    let bodyEnd = -1;

    for (let i = listStart; i < source.length; i++) {
        const char = source[i];
        if (char === '(') {
            depth++;
            if (bodyStart === -1) bodyStart = i + 1;
        } else if (char === ')') {
            depth--;
            if (depth === 0) {
                bodyEnd = i;
                break;
            }
        }
    }

    if (bodyStart === -1 || bodyEnd === -1) {
        fail('Unable to parse ProviderRegistry listOf(...) body.');
    }

    const body = stripComments(source.slice(bodyStart, bodyEnd));
    const items = [];
    const providerCallPattern = /\b([A-Z][A-Za-z0-9_]*)\s*\(([^)]*)\)/g;
    let match;

    while ((match = providerCallPattern.exec(body)) !== null) {
        const className = match[1];
        if (!className.endsWith('Provider')) continue;
        items.push({
            className,
            args: match[2].split(',').map(arg => arg.trim()).filter(Boolean)
        });
    }

    if (items.length === 0) fail('No providers found in ProviderRegistry.kt.');
    return items;
}

function extractClassMetadata() {
    const metadata = new Map();

    for (const filePath of listKotlinFiles(dataDir)) {
        const source = stripComments(readFile(filePath));
        const classPattern = /\bclass\s+([A-Z][A-Za-z0-9_]*)\b[\s\S]*?:\s*CustomDataProvider\s*\{/g;
        const matches = [...source.matchAll(classPattern)];

        for (let index = 0; index < matches.length; index++) {
            const match = matches[index];
            const className = match[1];
            const start = match.index;
            const next = matches[index + 1]?.index ?? source.length;
            const block = source.slice(start, next);
            const keyMatch = block.match(/\boverride\s+val\s+key(?:\s*:\s*String)?\s*=\s*"([^"]+)"/);
            const categoryMatch = block.match(/\boverride\s+val\s+category(?:\s*:\s*DataCategory)?\s*=\s*DataCategory\.([A-Z_]+)/);

            if (!keyMatch || !categoryMatch) continue;

            metadata.set(className, {
                keyTemplate: keyMatch[1],
                category: categoryMatch[1]
            });
        }
    }

    return metadata;
}

function resolveKey(template, providerArgs) {
    if (template.includes('$index')) {
        const indexValue = providerArgs[0];
        if (!indexValue) fail(`Provider key template ${template} requires an index argument.`);
        return template.replace(/\$index\b/g, indexValue);
    }

    return template;
}

function buildPredefinedData() {
    const registryItems = extractRegistryItems(readFile(registryPath));
    const classMetadata = extractClassMetadata();
    const grouped = new Map();
    const missing = [];

    for (const item of registryItems) {
        const metadata = classMetadata.get(item.className);
        if (!metadata) {
            missing.push(item.className);
            continue;
        }

        const key = resolveKey(metadata.keyTemplate, item.args);
        if (!grouped.has(metadata.category)) grouped.set(metadata.category, []);
        grouped.get(metadata.category).push(key);
    }

    if (missing.length > 0) {
        fail(`Missing key/category metadata for providers: ${missing.join(', ')}`);
    }

    return grouped;
}

function formatPredefinedBlock(grouped) {
    const lines = ['export const PREDEFINED_DATA = {'];
    const entries = [...grouped.entries()];
    const formatPropertyKey = key => /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(key) ? key : JSON.stringify(key);

    entries.forEach(([section, keys], index) => {
        const values = keys.map(key => JSON.stringify(key)).join(', ');
        const suffix = index === entries.length - 1 ? '' : ',';
        lines.push(`    ${formatPropertyKey(section)}: [${values}]${suffix}`);
    });

    lines.push('};');
    return lines.join('\n');
}

function extractXsightDataPoints() {
    const source = readFile(xsightPath);
    const items = [];
    const itemPattern = /\{\s*key:\s*'([^']+)'\s*,\s*displayName:\s*'([^']+)'\s*\}/g;
    let match;

    while ((match = itemPattern.exec(source)) !== null) {
        items.push({ key: match[1], displayName: match[2] });
    }

    if (items.length === 0) fail('No XSight datapoints found in xsight.js.');
    return items;
}

function generateReferenceDoc(grouped, xsightItems) {
    const standardCount = [...grouped.values()].reduce((sum, keys) => sum + keys.length, 0);
    const xsightCount = xsightItems.length;
    const lines = [
        '# Predefined Datapoints Reference',
        '',
        'This document is generated from `../CustomDataManager/app/src/main/java/customdatamanager/soti/mobicontrol/data/ProviderRegistry.kt` and the XSight picker in `src/modules/xsight.js`.',
        '',
        'Run `npm run sync:datapoints` after CustomDataManager adds, removes, or renames providers.',
        '',
        '## Important Notes',
        '',
        'When adding these datapoints to SOTI MobiControl via the API:',
        '- **Name (Technical Identifier)**: Cannot be changed - this is the `key` field used in the API.',
        '- **Title/Description**: Can be customized - this is the `description` field sent to the API.',
        '- **Technical Configuration**: Cannot be changed - includes file path, section name, value name, data type, and expression.',
        '',
        '## Standard Predefined Datapoints',
        '',
        '**INI File:** `/sdcard/Download/customdata.ini`',
        '**Data Type:** STRING',
        ''
    ];

    for (const [section, keys] of grouped.entries()) {
        lines.push(`### ${section} Section`);
        lines.push('| Key | Current Title/Description | Section | Value Name |');
        lines.push('|-----|---------------------------|---------|------------|');
        keys.forEach(key => {
            lines.push(`| ${key} | ${section} - ${key} | ${section} | ${key} |`);
        });
        lines.push('');
    }

    lines.push('## XSight Agent Datapoints');
    lines.push('');
    lines.push('**INI File:** `/sdcard/Download/XSightReport_AllJson.ini`');
    lines.push('**Data Type:** STRING');
    lines.push('');
    lines.push('| Key | Display Name | Current Title/Description | Section | Value Name |');
    lines.push('|-----|--------------|---------------------------|---------|------------|');
    xsightItems.forEach(item => {
        const parts = item.key.split('.');
        const section = parts.length > 1 ? parts[0] : 'Status';
        const valueName = parts.length > 1 ? parts.slice(1).join('.') : item.key;
        lines.push(`| ${item.key} | ${item.displayName} | XSight Agent - ${item.displayName} | ${section} | ${valueName} |`);
    });
    lines.push('');
    lines.push('## Summary Statistics');
    lines.push('');
    lines.push(`- **Total Standard Predefined Datapoints:** ${standardCount}`);
    lines.push(`- **Total XSight Agent Datapoints:** ${xsightCount}`);
    lines.push(`- **Total Datapoints:** ${standardCount + xsightCount}`);
    lines.push('');
    lines.push('### Breakdown by Section (Standard Datapoints)');
    [...grouped.entries()].forEach(([section, keys]) => {
        lines.push(`- ${section}: ${keys.length}`);
    });
    lines.push('');
    lines.push('## API Implementation Details');
    lines.push('');
    lines.push('When a datapoint is added to SOTI MobiControl, the API request structure is:');
    lines.push('');
    lines.push('```json');
    lines.push('{');
    lines.push('  "Name": "<key>",');
    lines.push('  "Description": "<customizable-title>",');
    lines.push('  "PhysicalType": "String",');
    lines.push('  "DeviceFamily": "AndroidPlus",');
    lines.push('  "DeviceKinds": ["AndroidPlus", "AndroidElm", "AndroidForWork", "AndroidKnox"],');
    lines.push('  "Enabled": true,');
    lines.push('  "Expression": "INI://<file>?SC=<section>&NM=<valName>"');
    lines.push('}');
    lines.push('```');
    lines.push('');
    lines.push('Only the `Description` field (shown as "Title" in the UI) can be customized when adding datapoints to SOTI MobiControl.');
    lines.push('');

    return lines.join('\n');
}

function replacePredefinedBlock(source, replacement) {
    const start = source.indexOf('export const PREDEFINED_DATA = {');
    if (start === -1) fail('Unable to find PREDEFINED_DATA block in predefined.js.');

    let depth = 0;
    let end = -1;

    for (let i = start; i < source.length; i++) {
        const char = source[i];
        if (char === '{') depth++;
        if (char === '}') {
            depth--;
            if (depth === 0 && source.slice(i, i + 2) === '};') {
                end = i + 2;
                break;
            }
        }
    }

    if (end === -1) fail('Unable to parse PREDEFINED_DATA block in predefined.js.');
    return `${source.slice(0, start)}${replacement}${source.slice(end)}`;
}

const grouped = buildPredefinedData();
const replacement = formatPredefinedBlock(grouped);
const current = readFile(predefinedPath);
const next = replacePredefinedBlock(current, replacement);
const xsightItems = extractXsightDataPoints();
const currentReference = readFile(datapointsReferencePath);
const nextReference = generateReferenceDoc(grouped, xsightItems);
const count = [...grouped.values()].reduce((sum, keys) => sum + keys.length, 0);

if (checkOnly) {
    const outOfSync = [];
    if (current !== next) outOfSync.push(predefinedPath);
    if (currentReference !== nextReference) outOfSync.push(datapointsReferencePath);

    if (outOfSync.length > 0) {
        console.error(`Predefined datapoints are out of sync with ${managerRoot}. Expected ${count} standard datapoints.`);
        outOfSync.forEach(filePath => console.error(`  ${filePath}`));
        process.exit(1);
    }
    console.log(`Predefined datapoints are in sync with ${managerRoot} (${count} datapoints).`);
    process.exit(0);
}

fs.writeFileSync(predefinedPath, next);
fs.writeFileSync(datapointsReferencePath, nextReference);
console.log(`Synced ${count} CustomDataManager datapoints from ${managerRoot}.`);
