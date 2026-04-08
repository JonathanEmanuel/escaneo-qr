const video = document.getElementById("video");
const canvas = document.getElementById("canvas");
const context = canvas.getContext("2d");

const btnIniciar = document.getElementById("btnIniciar");
const btnEscanear = document.getElementById("btnEscanear");
const btnUbicacion = document.getElementById("btnUbicacion");
const btnRegistrar = document.getElementById("btnRegistrar");
const btnLimpiar = document.getElementById("btnLimpiar");

const estado = document.getElementById("estado");
const qrResultado = document.getElementById("qrResultado");
const latitudSpan = document.getElementById("latitud");
const longitudSpan = document.getElementById("longitud");
const payloadPre = document.getElementById("payload");

let currentStream = null;
let qrLeido = null;
let ubicacionActual = null;

// =========================
// INICIAR CÁMARA
// =========================
async function iniciarCamara() {
  try {
    if (currentStream) {
      currentStream.getTracks().forEach(track => track.stop());
    }

    estado.textContent = "Solicitando acceso a la cámara...";

    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: "environment"
      },
      audio: false
    });

    currentStream = stream;
    video.srcObject = stream;

    estado.textContent = "Cámara iniciada correctamente.";
  } catch (error) {
    console.error(error);
    estado.textContent = "No se pudo acceder a la cámara.";
  }
}

// =========================
// ESCANEAR QR
// =========================
function escanearQR() {
  if (!video.srcObject) {
    estado.textContent = "Primero debés iniciar la cámara.";
    return;
  }

  if (video.readyState !== video.HAVE_ENOUGH_DATA) {
    estado.textContent = "El video todavía no está listo. Intentá nuevamente.";
    return;
  }

  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;

  context.drawImage(video, 0, 0, canvas.width, canvas.height);

  const imageData = context.getImageData(0, 0, canvas.width, canvas.height);

  const code = jsQR(imageData.data, canvas.width, canvas.height);

  if (code) {
    qrLeido = code.data;
    qrResultado.textContent = qrLeido;
    estado.textContent = "Código QR detectado correctamente.";
  } else {
    estado.textContent = "No se detectó ningún código QR.";
  }
}

// =========================
// OBTENER GEOLOCALIZACIÓN
// =========================
function obtenerUbicacion() {
  if (!("geolocation" in navigator)) {
    estado.textContent = "La geolocalización no está disponible en este navegador.";
    return;
  }

  estado.textContent = "Obteniendo ubicación...";

  navigator.geolocation.getCurrentPosition(
    (position) => {
      const lat = position.coords.latitude;
      const lon = position.coords.longitude;

      ubicacionActual = { lat, lon };

      latitudSpan.textContent = lat;
      longitudSpan.textContent = lon;
      estado.textContent = "Ubicación obtenida correctamente.";
    },
    (error) => {
      console.error(error);
      switch (error.code) {
        case error.PERMISSION_DENIED:
          estado.textContent = "El usuario rechazó el permiso de geolocalización.";
          break;
        case error.POSITION_UNAVAILABLE:
          estado.textContent = "La ubicación no está disponible.";
          break;
        case error.TIMEOUT:
          estado.textContent = "Tiempo de espera agotado.";
          break;
        default:
          estado.textContent = "Ocurrió un error al obtener la ubicación.";
      }
    },
    {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0
    }
  );
}

// =========================
// REGISTRAR ENTREGA
// =========================
function registrarEntrega() {
  if (!qrLeido) {
    estado.textContent = "Primero debés escanear un código QR.";
    return;
  }

  if (!ubicacionActual) {
    estado.textContent = "Primero debés obtener la ubicación.";
    return;
  }

  const payload = {
    pedido: qrLeido,
    entregado: true,
    ubicacion: {
      latitud: ubicacionActual.lat,
      longitud: ubicacionActual.lon
    },
    fecha: new Date().toISOString()
  };

  payloadPre.textContent = JSON.stringify(payload, null, 2);
  estado.textContent = "Entrega registrada. Payload listo para enviar al servidor.";
}

// =========================
// LIMPIAR
// =========================
function limpiarDatos() {
  qrLeido = null;
  ubicacionActual = null;

  qrResultado.textContent = "-";
  latitudSpan.textContent = "-";
  longitudSpan.textContent = "-";
  payloadPre.textContent = "{}";

  estado.textContent = "Datos limpiados.";
}

// =========================
// EVENTOS
// =========================
btnIniciar.addEventListener("click", iniciarCamara);
btnEscanear.addEventListener("click", escanearQR);
btnUbicacion.addEventListener("click", obtenerUbicacion);
btnRegistrar.addEventListener("click", registrarEntrega);
btnLimpiar.addEventListener("click", limpiarDatos);