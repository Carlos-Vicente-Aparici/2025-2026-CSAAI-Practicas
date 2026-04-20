const config = {
    secuencias: {
        "cama-casa": ["Cama", "Cama", "Cama", "Cama", "Casa", "Casa", "Casa", "Casa"],
        "pato-gato": ["Pato", "Gato", "Pato", "Gato", "Pato", "Gato", "Pato", "Gato"],
        "cerdo-cero": ["Cerdo", "Cerdo", "Cero", "Cero", "Cerdo", "Cerdo", "Cero", "Cero"]
    },
    velocidades: [450, 350, 250, 200, 150] 
};

let estado = {
    nivelActual: 1,
    posicion: 0,
    intervalo: null,
    tiempo: 0,
    timerGlobal: null,
    musicaOn: false 
};

// Referencias seguras
const getEl = (id) => document.getElementById(id);

function renderGrid() {
    const grid = getEl('grid-juego');
    if (!grid) return;
    grid.innerHTML = '';
    const seqKey = getEl('select-secuencia').value;
    const items = config.secuencias[seqKey];
    
    items.forEach((label, i) => {
        const card = document.createElement('div');
        card.className = 'card';
        card.id = `card-${i}`;
        card.innerHTML = `
            <img src="${label.toLowerCase()}.png" onerror="this.src='https://via.placeholder.com/80?text=${label}'">
            <div style="margin-top:5px; font-size:12px; font-weight: bold;">${label.toUpperCase()}</div>
        `;
        grid.appendChild(card);
    });
}

function detenerTodoAudio() {
    const audioFondo = getEl('audio-fondo');
    const audioCuenta = getEl('audio-cuenta');
    
    audioFondo.pause();
    audioFondo.currentTime = 0;
    audioCuenta.pause();
    audioCuenta.currentTime = 0;
}

function ejecutarNivel() {
    if (estado.nivelActual > 5) {
        detenerTodoAudio();
        getEl('palabra-principal').innerText = "¡TERMINADO!";
        toggleControls(false);
        return;
    }
    
    estado.posicion = 0;
    getEl('display-nivel').innerText = estado.nivelActual + "/5";
    getEl('display-estado').innerText = "PREPÁRATE";
    getEl('palabra-principal').innerText = "1, 2, 3...";
    
    if (estado.musicaOn) {
        getEl('audio-cuenta').currentTime = 0;
        getEl('audio-cuenta').play().catch(() => {});
    }

    setTimeout(() => {
        getEl('display-estado').innerText = "¡DILO!";
        const seqKey = getEl('select-secuencia').value;
        const patron = config.secuencias[seqKey];
        const vel = config.velocidades[estado.nivelActual - 1];

        estado.intervalo = setInterval(() => {
            document.querySelectorAll('.card').forEach(c => c.classList.remove('active'));
            
            if (estado.posicion < 8) {
                const act = getEl("card-" + estado.posicion);
                if (act) act.classList.add('active');
                getEl('palabra-principal').innerText = patron[estado.posicion].toUpperCase();
                estado.posicion++;
            } else {
                clearInterval(estado.intervalo);
                estado.nivelActual++;
                setTimeout(ejecutarNivel, 1000);
            }
        }, vel);
    }, 1800); 
}

function toggleControls(disable) {
    getEl('select-secuencia').disabled = disable;
    getEl('select-nivel').disabled = disable;
    getEl('btn-inicio').disabled = disable;
    getEl('btn-detener').disabled = !disable;
}

// ASIGNACIÓN DE EVENTOS (MANERA ROBUSTA)
window.addEventListener('DOMContentLoaded', () => {
    renderGrid();

    getEl('btn-musica').onclick = function() {
        estado.musicaOn = !estado.musicaOn;
        getEl('musica-status').innerText = estado.musicaOn ? "ON" : "OFF";
        
        if (estado.musicaOn) {
            // Si el juego ya empezó, activamos la música de fondo
            if (getEl('btn-inicio').disabled) {
                getEl('audio-fondo').play().catch(() => {});
            }
        } else {
            detenerTodoAudio();
        }
    };

    getEl('btn-inicio').onclick = function() {
        detenerTodoAudio();
        
        if (estado.musicaOn) {
            getEl('audio-fondo').play().catch(() => {});
        }
        
        estado.nivelActual = parseInt(getEl('select-nivel').value);
        estado.tiempo = 0;
        toggleControls(true);
        
        clearInterval(estado.timerGlobal);
        estado.timerGlobal = setInterval(() => {
            estado.tiempo += 0.1;
            getEl('display-tiempo').innerText = estado.tiempo.toFixed(1) + 's';
        }, 100);

        ejecutarNivel();
    };

    getEl('btn-detener').onclick = function() {
        location.reload();
    };

    getEl('select-secuencia').onchange = renderGrid;
});