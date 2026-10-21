/* Zet content.md om naar js/content.js, zodat index.html ook werkt
   als je het rechtstreeks opent (file://), waar fetch() geblokkeerd is.

   Gebruik (vanuit de map v1):
     node build.js          één keer omzetten
     node build.js --watch  automatisch opnieuw bij elke wijziging */

const fs = require('fs');
const path = require('path');

const src = path.join(__dirname, 'content.md');
const out = path.join(__dirname, 'js', 'content.js');

function build() {
  const md = fs.readFileSync(src, 'utf8');
  const js = '/* Automatisch gemaakt uit content.md door build.js — niet zelf aanpassen. */\n'
    + `window.CONTENT_MD = ${JSON.stringify(md)};\n`;
  fs.writeFileSync(out, js);
  console.log(`content.js bijgewerkt (${new Date().toLocaleTimeString()})`);
}

build();

if (process.argv.includes('--watch')) {
  let timer;
  fs.watch(src, () => {
    clearTimeout(timer);
    timer = setTimeout(build, 100);
  });
  console.log('Wacht op wijzigingen in content.md… (Ctrl+C om te stoppen)');
}
