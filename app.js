
const areas = {
  "Magdalenas": {E: [1, 21]},
  "Coyasan": {A: [1, 5], H: [2, 32]},
  "Helados (M0)": Object.fromEntries(
    [..."GFEDCBA"].map(p => [p, [1, 50]])
  ),
  "Tartas (M2)": {O: [1, 70], P: [1, 70]}
};

const colores = [
  ["Blanco", "#ffffff", "#111111"],
  ["Amarillo", "#facc15", "#111111"],
  ["Azul", "#2563eb", "#ffffff"],
  ["Verde", "#16a34a", "#ffffff"],
  ["Rojo", "#dc2626", "#ffffff"]
];

const $ = id => document.getElementById(id);
let codes = {};

try {
  codes = JSON.parse(
    localStorage.getItem("almacen-colores-v1") || "{}"
  );
} catch(e) {}

$("area").innerHTML = Object.keys(areas)
  .map(a => `<option>${a}</option>`).join("");

function updatePasillos() {
  $("pasillo").innerHTML = Object.keys(
    areas[$("area").value]
  ).map(p => `<option>${p}</option>`).join("");
  $("resultado").innerHTML = "";
  loadCodes();
}

$("area").addEventListener("change", updatePasillos);

function ubicacion() {
  const a = $("area").value;
  const p = $("pasillo").value;
  const s = $("numero").value.trim();
  const n = Number(s);
  const [min, max] = areas[a][p];
  const valid = s !== "" && Number.isInteger(n)
    && n >= min && n <= max
    && !(a === "Coyasan" && p === "H" && n % 2);

  return {a, p, n, valid};
}

function render() {
  const {a, p, n, valid} = ubicacion();
  if (!valid) {
    $("resultado").innerHTML =
      '<p class="error">Ubicación no válida.</p>';
    return;
  }

  const v = codes[`${a}|${p}|${n}`] || {};
  $("resultado").innerHTML = `
    <h2 class="ok">✓ ${a} · ${p}-${n}</h2>
    <p class="muted">Códigos de colores:</p>
    <div class="colors">
      ${colores.map(([name,bg,fg]) => `
        <div class="color"
          style="background:${bg};color:${fg}">
          ${name}<span>${v[name] || "--"}</span>
        </div>
      `).join("")}
    </div>
    <p class="muted">-- = pendiente de configurar</p>
  `;
}

$("buscar").addEventListener("click", render);
$("numero").addEventListener("keydown", e => {
  if (e.key === "Enter") render();
});

$("config").innerHTML = colores.map(([name]) => `
  <label for="c${name}">${name}</label>
  <input id="c${name}" maxlength="2"
    inputmode="numeric" placeholder="Dos dígitos">
`).join("");

function loadCodes() {
  const {a,p,n} = ubicacion();
  const v = codes[`${a}|${p}|${n}`] || {};
  for (const [name] of colores) {
    $("c" + name).value = v[name] || "";
  }
}

$("guardar").addEventListener("click", () => {
  const {a,p,n,valid} = ubicacion();
  if (!valid) {
    $("guardado").textContent =
      "Primero selecciona una ubicación válida.";
    return;
  }

  const v = {};
  for (const [name] of colores) {
    const value = $("c" + name).value.trim();
    if (value && !/^\d{2}$/.test(value)) {
      $("guardado").textContent =
        `${name}: introduce exactamente dos dígitos.`;
      return;
    }
    if (value) v[name] = value;
  }

  codes[`${a}|${p}|${n}`] = v;
  try {
    localStorage.setItem(
      "almacen-colores-v1", JSON.stringify(codes)
    );
    $("guardado").textContent = "Códigos guardados.";
  } catch(e) {
    $("guardado").textContent =
      "No se pudieron guardar los códigos.";
  }
  render();
});

for (const id of ["area","pasillo","numero"]) {
  $(id).addEventListener("change", loadCodes);
}
$("numero").addEventListener("input", loadCodes);

$("estructura").innerHTML = Object.entries(areas)
  .map(([a,ps]) => `
    <h3>${a}</h3>
    <p>${Object.entries(ps).map(([p,r]) =>
      `Pasillo ${p}: ${r[0]}–${r[1]}${
        a === "Coyasan" && p === "H"
          ? " (solo pares)" : ""
      }`
    ).join("<br>")}</p>
  `).join("");

updatePasillos();

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js")
      .catch(() => {});
  });
}
