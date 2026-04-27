const fs = require('fs');
const path = require('path');

const exactReplacements = {
  'configuraci?n': 'configuración',
  'Configuraci?n': 'Configuración',
  'Categor?as': 'Categorías',
  'categor?a': 'categoría',
  'Categor?a': 'Categoría',
  'Administraci?n': 'Administración',
  'Sesi?n': 'Sesión',
  'Navegaci?n': 'Navegación',
  'b?sicos': 'básicos',
  'Descripci?n': 'Descripción',
  'M?x': 'Máx',
  'Acompa?ado': 'Acompañado',
  'Aseg?rate': 'Asegúrate',
  'Aqu?': 'Aquí',
  '?Seguro': '¿Seguro',
  '?Guardado': '¡Guardado',
  'correctaMen?te': 'correctamente',
  'men? digital': 'menú digital',
  '?? Editar Producto': '✏️ Editar Producto',
  '? Agregar Producto': '➕ Agregar Producto',
  '??? Nueva Categor?a': '➕ Nueva Categoría',
  '?? Editar Categor?a': '✏️ Editar Categoría',
  '<span className="text-4xl">??</span>': '<span className="text-4xl">🍗</span>',
  '<span className="text-6xl mb-4 block">??</span>': '<span className="text-6xl mb-4 block">⭐</span>',
  '<span className="text-gray-600 text-6xl">???</span>': '<span className="text-gray-600 text-6xl">❓</span>',
  'Esta abierto y recibiendo pedidos?': '¿Está abierto y recibiendo pedidos?',
  'favoritos an': 'favoritos aún',
  'est cerrado': 'está cerrado',
  'Explora el Men?': 'Explora el menú',
  'El Pollo Bravo ??': 'El Pollo Bravo 🍗',
  'Qu se te antoja hoy?': '¿Qué se te antoja hoy?',
  'Por Qu Elegirnos?': '¿Por Qué Elegirnos?'
};

function fixAllPaths(dir) {
  const files = require('fs').readdirSync(dir);
  for (const file of files) {
    const fullPath = require('path').join(dir, file);
    if (require('fs').statSync(fullPath).isDirectory()) {
      fixAllPaths(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      let code = fs.readFileSync(fullPath, 'utf8');
      let updated = code;
      
      for (const [bad, good] of Object.entries(exactReplacements)) {
        updated = updated.split(bad).join(good);
      }
      
      if (code !== updated) {
        fs.writeFileSync(fullPath, updated, 'utf8');
        console.log('Fixed ', fullPath);
      }
    }
  }
}

fixAllPaths('src');
