// Esperar a que el HTML cargue completamente
document.addEventListener('DOMContentLoaded', () => {
    obtenerPaises();
    configurarEventos();
});

let todosLosPaises = [];

function configurarEventos() {
    document.getElementById('buscar-pais').addEventListener('input', filtrarPaises);
    document.getElementById('filtrar-region').addEventListener('change', filtrarPaises);
    document.getElementById('toggle-modo').addEventListener('click', toggleModo);
    document.getElementById('volver').addEventListener('click', volverALista);
}

async function obtenerPaises() {
    try {
        const urlAPI = 'https://restcountries.com/v3.1/all?fields=name,flags,region,capital,population,cca3';
        const respuesta = await fetch(urlAPI, {
            method: 'GET',
            mode: 'cors',
            headers: {
                'Accept': 'application/json'
            }
        });

        if (!respuesta.ok) {
            const texto = await respuesta.text();
            throw new Error(`Error HTTP: ${respuesta.status} ${respuesta.statusText} - ${texto}`);
        }

        const datos = await respuesta.json();

        datos.sort((a, b) => a.name.common.localeCompare(b.name.common));
        todosLosPaises = datos;
        mostrarPaises(datos);
    } catch (error) {
        console.error('Error al obtener los datos:', error);
        mostrarError(error.message);
    }
}

function filtrarPaises() {
    const busqueda = document.getElementById('buscar-pais').value.toLowerCase();
    const region = document.getElementById('filtrar-region').value;

    let filtrados = todosLosPaises;

    if (region) {
        filtrados = filtrados.filter(pais => pais.region === region);
    }

    if (busqueda) {
        filtrados = filtrados.filter(pais => pais.name.common.toLowerCase().includes(busqueda));
    }

    mostrarPaises(filtrados);
}

function mostrarPaises(paises) {
    const contenedor = document.getElementById('contenedor-paises');
    contenedor.innerHTML = '';

    if (paises.length === 0) {
        contenedor.innerHTML = `
            <div class="col-12">
                <div class="alert alert-warning" role="alert">
                    No se encontraron países con esos criterios.
                </div>
            </div>
        `;
        return;
    }

    paises.forEach(pais => {
        const col = document.createElement('div');
        col.className = 'col-12 col-md-4 col-lg-3';

        col.innerHTML = `
            <div class="card h-100 shadow-sm">
                <img src="${pais.flags.svg}" class="card-img-top" alt="Bandera de ${pais.name.common}" style="height: 160px; object-fit: cover;">
                <div class="card-body">
                    <h5 class="card-title">${pais.name.common}</h5>
                    <h6 class="card-subtitle mb-2 text-muted">${pais.region}</h6>
                    <p class="card-text">
                        <strong>Capital:</strong> ${pais.capital ? pais.capital[0] : 'N/A'}<br>
                        <strong>Población:</strong> ${pais.population.toLocaleString()}
                    </p>
                    <button class="btn btn-primary btn-sm" onclick="detallesPais('${pais.cca3}')">
                        Ver más
                    </button>
                </div>
            </div>
        `;
        contenedor.appendChild(col);
    });
}

function mostrarError(mensaje) {
    const contenedor = document.getElementById('contenedor-paises');
    contenedor.innerHTML = `
        <div class="col-12">
            <div class="alert alert-danger" role="alert">
                <h4 class="alert-heading">Error al cargar países</h4>
                <p>${mensaje}</p>
                <hr>
                <button class="btn btn-primary" onclick="obtenerPaises()">Reintentar</button>
            </div>
        </div>
    `;
}

function toggleModo() {
    document.body.classList.toggle('dark-mode');
    const btn = document.getElementById('toggle-modo');
    btn.textContent = document.body.classList.contains('dark-mode') ? 'Modo Claro' : 'Modo Oscuro';
}

function volverALista() {
    document.getElementById('contenedor-paises').classList.remove('d-none');
    document.getElementById('detalles-pais').classList.add('d-none');
}

async function detallesPais(codigo) {
    try {
        const urlAPI = `https://restcountries.com/v3.1/alpha/${codigo}`;
        const respuesta = await fetch(urlAPI);
        if (!respuesta.ok) throw new Error('Error al obtener detalles');

        const [pais] = await respuesta.json();

        document.getElementById('contenedor-paises').classList.add('d-none');
        document.getElementById('detalles-pais').classList.remove('d-none');

        const infoDetalles = document.getElementById('info-detalles');
        infoDetalles.innerHTML = `
            <div class="col-12 col-md-6">
                <img src="${pais.flags.svg}" class="img-fluid mb-3" alt="Bandera de ${pais.name.common}">
            </div>
            <div class="col-12 col-md-6">
                <h2>${pais.name.common}</h2>
                <p><strong>Nombre oficial:</strong> ${pais.name.official}</p>
                <p><strong>Región:</strong> ${pais.region}</p>
                <p><strong>Subregión:</strong> ${pais.subregion || 'N/A'}</p>
                <p><strong>Capital:</strong> ${pais.capital ? pais.capital[0] : 'N/A'}</p>
                <p><strong>Población:</strong> ${pais.population.toLocaleString()}</p>
                <p><strong>Área:</strong> ${pais.area ? pais.area.toLocaleString() + ' km²' : 'N/A'}</p>
                <p><strong>Idiomas:</strong> ${pais.languages ? Object.values(pais.languages).join(', ') : 'N/A'}</p>
                <p><strong>Monedas:</strong> ${pais.currencies ? Object.values(pais.currencies).map(c => c.name).join(', ') : 'N/A'}</p>
                <p><strong>Países fronterizos:</strong></p>
                <div id="fronteras"></div>
            </div>
        `;

        const fronterasDiv = document.getElementById('fronteras');
        if (pais.borders && pais.borders.length > 0) {
            pais.borders.forEach(border => {
                const borderPais = todosLosPaises.find(p => p.cca3 === border);
                const nombre = borderPais ? borderPais.name.common : border;
                const btn = document.createElement('button');
                btn.className = 'btn btn-outline-primary btn-sm me-2 mb-2';
                btn.textContent = nombre;
                btn.onclick = () => detallesPais(border);
                fronterasDiv.appendChild(btn);
            });
        } else {
            fronterasDiv.innerHTML = 'Ninguno';
        }
    } catch (error) {
        console.error('Error al obtener detalles:', error);
        alert('Error al cargar detalles del país');
    }
}