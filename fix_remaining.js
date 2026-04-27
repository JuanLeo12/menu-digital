const fs = require('fs');

function repl(file, replacerList) {
  let c = fs.readFileSync(file, 'utf8');
  let original = c;
  for (let r of replacerList) {
    if (c.indexOf(r[0]) === -1) {
       console.log('Missed:', r[0], 'in', file);
    }
    c = c.split(r[0]).join(r[1]);
  }
  if (original !== c) {
    fs.writeFileSync(file, c);
    console.log('Fixed', file);
  }
}

repl('src/app/admin/page.tsx', [
  ['alert("Error guardando configuracion: "', 'alert("Error guardando configuración: "'],
  ['? "?✔️ Nueva Categoría"', '? "➕ Nueva Categoría"']
]);

repl('src/components/admin/CategoriasSection.tsx', [
  ['Agrega categorias', 'Agrega categorías'],
  ['organizar tu menu.', 'organizar tu menú.']
]);

repl('src/components/admin/ConfiguracionSection.tsx', [
  ['abre y cierra solo segun el horario', 'abre y cierra solo según el horario'],
  ['Deshabilita el boton manual', 'Deshabilita el botón manual']
]);

repl('src/components/CheckoutModal.tsx', [
  ['ingresa tu direccion.', 'ingresa tu dirección.']
]);

repl('src/app/page.tsx', [
  ['{activeTab === "favorites" ? "??" : "???"}', '{activeTab === "favorites" ? "💔" : "🍽️"}']
]);
