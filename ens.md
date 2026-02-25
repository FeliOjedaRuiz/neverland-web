# ens.md (Estructura de Narrativa del Sistema)

## 1. El Alma del Proyecto: ¿Qué es Neverland?

**Neverland** no es solo un sistema de gestión de reservas; es el motor digital de un salón de fiestas infantiles y parque de bolas físico real. Su propósito biológico en el mundo real es doble:

1.  **Para los Administradores (El Dueño):** Ser un empleado incansable que trabaja 24/7. Debe gestionar el calendario, evitar dobles reservas, calcular presupuestos complejos al instante y centralizar la información (integración con Google Calendar y WhatsApp) para liberar al dueño de la carga operativa manual.
2.  **Para los Clientes (Los Padres):** Ser una experiencia mágica, rápida y sin fricciones. Desde el celular (`Mobile-First` vital), un padre estresado debe poder organizar la fiesta de cumpleaños perfecta en la mitad de la noche, eligiendo menús, extras y horarios con total claridad y seguridad.

## 2. Puntos de Dolor y Soluciones (Narrativa Funcional)

### 2.1. El Caos de los Horarios

- **Dolor:** Solapamiento de fiestas en las 2 salas, errores humanos al anotar en papel.
- **Solución (La Lógica):** 3 turnos predefinidos (T1, T2, T3) inamovibles en su núcleo. Un sistema de semaforización estricto (Vista Calendario) donde el Backend y Google Calendar son la única fuente de verdad.

### 2.2. Presupuestos Complejos

- **Dolor:** Cobrar correctamente extras (tiempo, talleres, personajes) y menús variables (mínimo de niños, fines de semana).
- **Solución (El Motor de Reglas):** Un algoritmo centralizado (documentado en tu contexto) que calcula instantáneamente el precio. Nada se calcula "a ojo".

### 2.3. La Ansiedad del Cliente

- **Dolor:** "¿Ya está reservado? ¿Qué pasa si quiero cambiar algo?"
- **Solución (El Flujo de UX):** Estados claros en la reserva (Pendiente, Confirmada, Modificada). Panel de control post-reserva y notificaciones directas a WhatsApp gestionadas desde el panel de administración.

## 3. Arquitectura del Modelo Mental (Las Entidades)

Para entender Neverland, debes interactuar mentalmente con estas entidades principales:

1.  **`El Evento (Reserva/Bloqueo)`**: Es la célula base. Representa un bloque de tiempo (Turno) en una Fecha. Contiene a los _Niños_ (menú), _Adultos_ (aperitivos) y los _Extras_ (fantasía: personajes, talleres).
2.  **`El Configuardor de Precios`**: El cerebro financiero. Un administrador puede cambiar el precio de una tortilla en la BD y el sistema debe responder sin tocar código.
3.  **`El Espejo (Sincronización)`**: La API de Google Calendar no es un simple añadido, es un espejo bidireccional de la realidad física del salón. Si Google dice que está ocupado, la web debe bloquearse.

## 4. Visión de Sistema Vivo (El Futuro)

El sistema evoluciona en fases (actualmente transicionando a Fase 2/3). Las decisiones de código actuales **no deben bloquear** la futura integración de un Chatbot IA para WhatsApp/Web que actuará como el primer filtro de atención al cliente. La API debe mantenerse limpia y agnóstica para permitir esta evolución.
