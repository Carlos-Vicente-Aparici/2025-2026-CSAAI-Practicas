var clave = [];
var numIntentos = 7;
var numAciertos = 0;
var activo = false;

function generarNuevaClave() {
    clave = [];
    while (clave.length < 4) {
        var random = Math.floor(Math.random() * 10);
        if (!clave.includes(random)) {
            clave.push(random);
        }
    }
    console.log("Clave secreta: " + clave);
}

function pulsar(n) {
    if (numIntentos <= 0 || numAciertos === 4) return;

    if (activo == false) {
        inicio();
        activo = true;
    }

    document.getElementById("btn" + n).disabled = true;
    numIntentos--;
    document.getElementById("intentos").innerText = numIntentos;

    var aciertoEnTurno = false;
    for (var i = 0; i < 4; i++) {
        if (clave[i] === n) {
            var s = document.getElementById("s" + i);
            s.innerText = n;
            s.style.backgroundColor = "#0f0";
            s.style.color = "#000";
            numAciertos++;
            aciertoEnTurno = true;
        }
    }

    verificarEstado();
}

function verificarEstado() {
    var txt = document.getElementById("mensaje");
    var t = document.getElementById("displayCrono").innerText;

    if (numAciertos === 4) {
        parar();
        txt.innerText = "¡GANASTE! Tiempo: " + t + " Intentos: " + (7 - numIntentos);
        alert("¡Victoria!\nTiempo: " + t + "\nIntentos restantes: " + numIntentos);
    } else if (numIntentos === 0) {
        parar();
        for (var i = 0; i < 4; i++) {
            document.getElementById("s" + i).innerText = clave[i];
        }
        txt.innerText = "Partida perdida. Clave: " + clave.join("");
        alert("BOOM! Has perdido.");
    }
}

function reset() {
    generarNuevaClave();
    numIntentos = 7;
    numAciertos = 0;
    activo = false;
    resetCrono();

    document.getElementById("intentos").innerText = numIntentos;
    document.getElementById("mensaje").innerText = "Nueva partida lista.";
    
    for (var i = 0; i < 4; i++) {
        var div = document.getElementById("s" + i);
        div.innerText = "*";
        div.style.backgroundColor = "transparent";
        div.style.color = "#0f0";
    }

    for (var j = 0; j <= 9; j++) {
        var b = document.getElementById("btn" + j);
        if (b) {
            b.disabled = false;
        }
    }
}

generarNuevaClave();