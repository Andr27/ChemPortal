const { execSync } = require('child_process');
const fs = require('fs');

const colorToCommits = {
    '#ebedf0': 0,
    '#9be9a8': 1,
    '#40c463': 3,
    '#30a14e': 6,
    '#216e39': 11,
};

const filePath = process.argv[2];
const colors = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

const today = new Date();
today.setHours(0, 0, 0, 0);

const todayDayOfWeek = today.getDay();

const startDate = new Date(today);
startDate.setDate(startDate.getDate() - 364);
const startDayOfWeek = startDate.getDay();
if (startDayOfWeek !== 0) {
    startDate.setDate(startDate.getDate() - startDayOfWeek);
}

function getNumCols(row) {
    const baseCols = 53;
    return row <= todayDayOfWeek ? baseCols : baseCols - 1;
}

let index = 0;
for (let row = 0; row < 7; row++) {
    const numCols = getNumCols(row);
    for (let col = 0; col < numCols; col++) {
        const color = colors[index];
        index++;

        const commits = colorToCommits[color] ?? 0;
        if (commits === 0) continue;

        const cellDate = new Date(startDate);
        cellDate.setDate(cellDate.getDate() + col * 7 + row);

        if (cellDate > today) continue;

        const timestamp = cellDate.toISOString().replace('T', 'T').slice(0, 19);
        const fullTimestamp = `${timestamp.slice(0, 10)}T12:00:00`;

        for (let c = 0; c < commits; c++) {
            const t = `${fullTimestamp.slice(0, 19).slice(0, 17)}${String(c).padStart(2, '0')}`;
            execSync(`git commit --allow-empty -m "Activity commit ${t}"`, {
                env: {
                    ...process.env,
                    GIT_AUTHOR_DATE: t,
                    GIT_COMMITTER_DATE: t,
                }
            });
        }
    }
}

console.log('Done!');