# EduGestural: Entorno de Aprendizaje Kinestésico Mediante Realidad Aumentada 🎓✋

**EduGestural** es una aplicación web progresiva de Realidad Aumentada (RA) diseñada para la educación STEAM y el desarrollo de la motricidad fina. Utiliza algoritmos de visión artificial en el navegador para permitir a los usuarios manipular objetos 3D y participar en actividades lúdicas utilizando únicamente los gestos de sus manos, sin necesidad de hardware costoso o periféricos tradicionales.

![Captura del Proyecto](proy.jpg)

## 🚀 Características Principales

* **Interacción Natural (NUI):** Control total mediante gestos manuales (detección de 21 puntos clave por mano).
* **Motor 3D Web:** Renderizado fluido de sólidos platónicos y figuras geométricas con texturas procedimentales.
* **Suite de Minijuegos Educativos:**
    * 🧠 **Quiz Geométrico:** Gamificación para el aprendizaje de formas espaciales.
    * 📐 **Escultor de Tamaño:** Ejercicios de precisión motriz para igualar patrones.
    * 🎨 **Pintor Aéreo:** Lienzo virtual para dibujar en el aire mediante realidad aumentada.
* **Interfaz Adaptativa:** Sistema de "Jaula Invisible" que ajusta el área de juego para no obstruir los controles en diferentes resoluciones.
* **Feedback Multimedia:** Efectos de sonido sintetizados en tiempo real y sistema de captura de pantalla.

## 🛠️ Tecnologías Utilizadas

* **HTML5 / CSS3:** Estructura semántica y diseño responsivo moderno.
* **JavaScript (ES6+):** Lógica del núcleo y gestión de estados.
* **[p5.js](https://p5js.org/):** Librería principal para el renderizado gráfico y manejo del canvas WebGL.
* **[ml5.js](https://ml5js.org/):** Implementación del modelo **HandPose** (basado en MediaPipe de Google) para la detección de manos mediante Machine Learning en el cliente.

## 📋 Requisitos del Sistema

Para ejecutar el proyecto localmente o en producción:

### Hardware (Recomendado)
* **Procesador:** Intel Core i5/i7 o equivalente (soporte para instrucciones AVX).
* **GPU:** Tarjeta gráfica dedicada (ej. AMD Radeon RX 580 o NVIDIA GTX 1050) para aceleración WebGL.
* **Cámara:** Webcam HD o Smartphone conectado vía DroidCam (recomendado por su ISP y autoenfoque).

### Software
* **Navegador:** Mozilla Firefox (v120+) o Google Chrome (v110+).
* **Servidor Local:** Python 3.x (para evitar errores de CORS con los módulos ES6).

## 🔧 Instalación y Ejecución

1.  **Clonar el repositorio:**
    ```bash
    git clone [https://github.com/JesusFSP/ProyectoAC_EduGestural.git](https://github.com/JesusFSP/ProyectoAC_EduGestural.git)
    cd ProyectoAC_EduGestural
    ```

2.  **Iniciar un servidor local:**
    Debido a las políticas de seguridad de los navegadores para acceder a la cámara y módulos JS, no se puede abrir el `index.html` directamente. Usa Python:

    ```bash
    # En la terminal, dentro de la carpeta del proyecto:
    python3 -m http.server 8000
    ```

3.  **Abrir en el navegador:**
    Visita `http://localhost:8000` en tu navegador preferido.

4.  **Permisos:**
    Acepta el permiso de uso de la cámara web cuando el navegador lo solicite.

## 🎮 Guía de Uso

1.  **Menú Izquierdo (Configuración):**
    * Selecciona la figura geométrica (Cubo, Esfera, Dona, etc.).
    * Cambia entre modo "Color Sólido" o "Textura Realista".
    * Activa/Desactiva el modo "Doble Mano" para mayor precisión.
    * Activa "Estirar con Manos" para cambiar el tamaño de la figura separando tus manos.

2.  **Menú Derecho (Minijuegos):**
    * Selecciona un modo de juego para comenzar.
    * Sigue las instrucciones en el panel inferior (HUD).
    * Usa el botón "Guardar Foto" para descargar una captura de tu sesión.

## Créditos y Atribución

Este proyecto fue desarrollado como parte del curso de **Arquitectura de Computadoras (2026)**.

* **Desarrollador Principal:** Jesus Francisco Silva Pino.
* **Código Base:** Adaptado y evolucionado a partir del trabajo de [Damián Sire (AR Figures)](https://github.com/damiansire/artificial-intelligence-augmented-reality-figures).
* **Librerías:** Agradecimientos a la Fundación Processing y la comunidad ml5.js.
