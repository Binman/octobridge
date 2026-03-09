const fs = require('fs');
const path = require('path');

const ROOT_DIR = process.cwd();
const ONGOING_DIR = path.join(ROOT_DIR, 'Coming Events', 'Ongoing');

function monthLabel(monthNumber) {
    const months = [
        'JANUARY',
        'FEBRUARY',
        'MARCH',
        'APRIL',
        'MAY',
        'JUNE',
        'JULY',
        'AUGUST',
        'SEPTEMBER',
        'OCTOBER',
        'NOVEMBER',
        'DECEMBER'
    ];
    return months[monthNumber - 1];
}

function labelFromFolder(folderName) {
    if (/^\d{6}$/.test(folderName)) {
        const year = folderName.slice(0, 4);
        const month = Number(folderName.slice(4, 6));
        if (month >= 1 && month <= 12) {
            return `${monthLabel(month)} ${year}`;
        }
    }

    return folderName.replace(/[-_]+/g, ' ').toUpperCase();
}

function ensurePlaceholderPage(folderName, folderDir) {
    const placeholderPath = path.join(folderDir, 'index.html');
    if (fs.existsSync(placeholderPath)) {
        return `${folderName}/index.html`;
    }

    const placeholderHtml = `<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>OctoBridge</title>
    <link rel="icon" type="image/png" href="../../../index/logo.png">
    <link rel="stylesheet" href="../../../styles.css">
</head>

<body>
    <div class="overlay"></div>
    <div class="container">
        <main class="content">
            <h1 class="title">${labelFromFolder(folderName)}</h1>
            <div class="divider"></div>
            <p class="message">Event details will be published soon.</p>
        </main>
        <div class="navigation-section">
            <div class="navigation-links">
                <a href="../index.html" class="navigation-link">BACK TO ONGOING</a>
                <a href="../../../index/index.html" class="navigation-link">BACK HOME</a>
            </div>
        </div>
    </div>
</body>

</html>
`;

    fs.writeFileSync(placeholderPath, placeholderHtml, 'utf8');
    return `${folderName}/index.html`;
}

function resolveEventHref(folderName) {
    const folderDir = path.join(ONGOING_DIR, folderName);
    const primaryHtml = path.join(folderDir, `${folderName}.html`);
    const indexHtml = path.join(folderDir, 'index.html');

    if (fs.existsSync(primaryHtml)) {
        return `${folderName}/${folderName}.html`;
    }

    if (fs.existsSync(indexHtml)) {
        return `${folderName}/index.html`;
    }

    const htmlCandidates = fs
        .readdirSync(folderDir, { withFileTypes: true })
        .filter((entry) => entry.isFile() && entry.name.toLowerCase().endsWith('.html'))
        .map((entry) => entry.name)
        .sort((a, b) => a.localeCompare(b));

    if (htmlCandidates.length > 0) {
        return `${folderName}/${htmlCandidates[0]}`;
    }

    return ensurePlaceholderPage(folderName, folderDir);
}

function compareFolders(a, b) {
    const aIsNumeric = /^\d+$/.test(a);
    const bIsNumeric = /^\d+$/.test(b);

    if (aIsNumeric && bIsNumeric) {
        return Number(a) - Number(b);
    }

    return a.localeCompare(b);
}

function generateOngoingIndexHtml(eventItems) {
    const eventLinks = eventItems
        .map((item) => `                <a href="${item.href}" class="navigation-link">${item.label}</a>`)
        .join('\n');

    return `<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>OctoBridge</title>
    <link rel="icon" type="image/png" href="../../index/logo.png">
    <link rel="stylesheet" href="../../styles.css">
</head>

<body style="background-image: url('./ongoing.jpg');">
    <div class="overlay"></div>
    <div class="container">
        <main class="content">
            <h1 class="title">Ongoing Events</h1>
            <div class="divider"></div>
        </main>
        <div class="navigation-section">
            <div class="navigation-links">
${eventLinks}
                <a href="../../index/index.html" class="navigation-link">BACK HOME</a>
            </div>
        </div>
    </div>
</body>

</html>
`;
}

function main() {
    if (!fs.existsSync(ONGOING_DIR)) {
        throw new Error(`Missing directory: ${ONGOING_DIR}`);
    }

    const folders = fs
        .readdirSync(ONGOING_DIR, { withFileTypes: true })
        .filter((entry) => entry.isDirectory())
        .map((entry) => entry.name)
        .sort(compareFolders);

    const eventItems = folders.map((folderName) => ({
        href: resolveEventHref(folderName),
        label: labelFromFolder(folderName)
    }));

    const outputHtml = generateOngoingIndexHtml(eventItems);
    const ongoingIndexPath = path.join(ONGOING_DIR, 'index.html');
    fs.writeFileSync(ongoingIndexPath, outputHtml, 'utf8');

    process.stdout.write(`Generated ${ongoingIndexPath} with ${eventItems.length} event link(s).\n`);
}

main();