const sqlite3 = require('sqlite3');
const fs = require('fs');
const db = new sqlite3.Database('published.db');
db.run("CREATE TABLE IF NOT EXISTS points (url TEXT, lat LONG, long LONG, UNIQUE(url))");
// Prevent corruption
db.run('PRAGMA synchronous=FULL')
db.run('PRAGMA count_changes=OFF')
db.run('PRAGMA journal_mode=DELETE')
db.run('PRAGMA temp_store=DEFAULT')
const urlsToProcess = JSON.parse(fs.readFileSync("tao_photospheres.json"))

urlsToProcess.forEach((url) => {
    console.log(url.url);
    db.serialize(function () {
        let stmt = db.prepare(`DELETE FROM points WHERE url = '${url.url}';`);
        stmt.run();
        stmt.finalize();
    });
})
