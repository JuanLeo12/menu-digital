const fs = require('fs');
const path = require('path');

function searchIssues(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      searchIssues(fullPath);
    } else if (fullPath.endsWith('.ts') || fullPath.endsWith('.tsx')) {
      const content = fs.readFileSync(fullPath, 'utf8');
      const lines = content.split('\n');
      
      lines.forEach((line, i) => {
        let text = line;
        
        const typos = /(Tambin|Tambi[eé]n\b|\bMenu\b|\bMenus\b|\bTelefono\b|\bDireccion\b|\bInformacion\b|\bConfiguracion\b|\bOpcion\b|\bSeccion\b|\bUbicacion\b|\bRapido\b|\bEnvio\b|\bUnico\b|\bUltimo\b|\bAutentico\b|\bBoton\b|\bPoltica\b|\bContrasea\b|\bCaractersticas\b|\bDiseo\b|\bCategoras\b|\bMas\b|\bmas\b)/i;
        
        // Remove valid JS operator uses of ?
        let cleaned = text.replace(/\?\./g, '');
        cleaned = cleaned.replace(/\?\?/g, '');
        cleaned = cleaned.replace(/\?:/g, '');
        cleaned = cleaned.replace(/ \? /g, '');
        
        let hasQuestionMark = cleaned.includes('?');
        // Ignore real questions
        if (cleaned.includes('¿')) hasQuestionMark = false;
        if (text.includes('whatsapp') || text.includes('http')) hasQuestionMark = false;
        
        if (hasQuestionMark || typos.test(text)) {
           // Skip if the match is just "mas" in "transform-style: preserve-3d" or something. Wait, just output.
           console.log(fullPath + ':' + (i+1) + '  ' + line.trim());
        }
      });
    }
  }
}
searchIssues('src');
