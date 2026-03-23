var tiempo = 0;
var idIntervalo;

function inicio() {
    parar();
    idIntervalo = setInterval(actualizar, 10);
}

function parar() {
    clearInterval(idIntervalo);
}

function actualizar() {
    tiempo++;
    var m = Math.floor(tiempo / 6000);
    var s = Math.floor((tiempo % 6000) / 100);
    var c = tiempo % 100;
    
    var vis = m + ":" + (s < 10 ? "0" + s : s) + ":" + (c < 10 ? "0" + c : c);
    document.getElementById("displayCrono").innerText = vis;
}

function resetCrono() {
    parar();
    tiempo = 0;
    document.getElementById("displayCrono").innerText = "0:00:00";
}