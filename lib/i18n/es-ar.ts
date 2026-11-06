import type { Dict } from "./en";
import { es } from "./es";

// Argentine Spanish: same content as es, with voseo and local wording where the visitor is addressed.
export const esAr: Dict = {
  ...es,
  hero: {
    ...es.hero,
    intro:
      "Soy Yukine. Diseño y desarrollo hubs de recompensas y tiendas online para streamers: leaderboards en vivo, torneos desde el chat, tiendas de merch y login con Discord. Hechos desde cero alrededor de tu marca, y después del lanzamiento los manejás vos.",
    scroll: "Deslizá",
  },
  work: {
    ...es.work,
    pageIntro:
      "19+ webs entregadas. Acá tenés tres en detalle: hubs de recompensas y tiendas para streamers de Kick, cada uno diseñado alrededor de la marca del streamer y manejado desde su propio panel. Abrí uno para ver el caso completo y su álbum.",
  },
  caseUi: { ...es.caseUi, albumNote: "Hacé clic en una pantalla para abrirla. Las pantallas de leaderboard y tienda usan datos de ejemplo; los nombres de jugadores están ocultos." },
  services: {
    ...es.services,
    title: ["Lo que puedo", "construir para vos"],
    items: es.services.items.map((it, i) =>
      i === 0 ? { ...it, text: "Un lugar para tu comunidad, con tu marca: los viewers se registran con tu código, compiten y ganan, y vos manejás todo desde un panel." } : it
    ),
    pageIntro: "Hubs de recompensas, tiendas de merch, webs para creadores y bots de Discord. Diseñados alrededor de tu marca, hechos desde cero y entregados para que los manejes vos.",
    packagesTitle: ["Elegí un", "punto de partida"],
    packagesIntro: "Cada proyecto se presupuesta según su alcance. Estos son los puntos de partida habituales; combiná lo que necesites.",
    quote: "Pedí presupuesto",
  },
  process: {
    ...es.process,
    steps: [
      { title: "Hablamos", text: "Me contás lo que necesitás por X, Discord o el formulario. Te respondo con alcance, precio y plazos." },
      { title: "Diseño", text: "Una primera versión alrededor de tu marca: logo, colores, mascota. La ves rápido." },
      { title: "Desarrollo", text: "El avance en un link de vista previa. Comentás y ajusto." },
      { title: "Lanzamiento", text: "Dominio, hosting y acceso de admin entregados. Sigo disponible para arreglos." },
    ],
  },
  about: { ...es.about, meet: "Conocé a la mascota", meetText: "Tocalo. No muerde." },
  faq: {
    ...es.faq,
    items: [
      { q: "¿Cuánto tarda una web?", a: "Depende del alcance. Una web simple sale rápido; un hub completo con leaderboards, eventos y panel lleva más. Tenés un plazo claro antes de arrancar." },
      { q: "¿Puedo cambiar cosas yo después?", a: "Sí. Las webs de streamers traen un panel para leaderboards, eventos, premios y páginas." },
      { q: "¿De quién son la web y el código?", a: "Tuyos. El dominio, el hosting y el código son tuyos. Te entrego todo en el lanzamiento." },
      { q: "¿Una web de recompensas es un casino?", a: "No. La web no acepta depósitos ni tiene juegos con plata real. Muestra leaderboards y eventos basados en tus datos de afiliado." },
      { q: "¿Trabajás con Kick, Twitch y Discord?", a: "Sí. Hice comandos de chat de Kick, webhooks de Kick, login con Discord, bots de tickets y bots a medida." },
      { q: "¿Mi web puede estar en varios idiomas?", a: "Sí. Esta web funciona en 7 idiomas, incluido el árabe de derecha a izquierda. La tuya también puede." },
    ],
  },
  cta: { ...es.cta, title: ["¿Tenés un stream", "o una tienda?", "Armémoslo."], text: "Contame qué tenés en mente. Vas a tener un plan y unos plazos antes de arrancar.", start: "Escribime" },
  contact: {
    ...es.contact,
    title: ["Armemos", "tu web."],
    intro: "Lo más rápido: un DM a @yuuukine1 en X o agregá a yuuukine en Discord. O dejá un mensaje acá; llega directo a mi Discord.",
    dmX: "Escribime en X",
    discordText: "Agregame como amigo. Tocá para copiar mi usuario.",
    sentText: "Acaba de llegar a mi Discord. Te respondo pronto, casi siempre el mismo día.",
    errInvalid: "Poné tu nombre, cómo contactarte y unas palabras.",
    errLimit: "Demasiados mensajes. Esperá unos minutos.",
    errDown: "No se pudo enviar ahora. Escribile a @yuuukine1 en X.",
  },
  discord: { ...es.discord },
  dock: { ...es.dock, title: "¿Tenés un proyecto?", text: "Elegí lo más fácil. Suelo responder el mismo día." },
};
