import { useMemo, useState } from "react";
import { NEGOCIO, CATEGORIAS } from "../config";
import { useCollection, modoDemo } from "../lib/db";
import { money, iniciales, linkWhatsApp } from "../lib/utils";
import Reserva from "./Reserva.jsx";
import HeroScene3D from "../components/HeroScene3D.jsx";
import LegalModal from "../components/LegalModals.jsx";

export default function PublicSite() {
  const [servicios] = useCollection("servicios");
  const [estilistas] = useCollection("estilistas");
  const [productos] = useCollection("productos");
  const [cat, setCat] = useState("Todos");
  const [preSel, setPreSel] = useState(null);
  const [menu, setMenu] = useState(false);
  const [legalModal, setLegalModal] = useState(null);

  const activos = servicios.filter((s) => s.activo !== false);
  const cats = [
    "Todos",
    ...CATEGORIAS.filter((c) => activos.some((s) => s.categoria === c)),
  ];
  const lista = useMemo(
    () => activos.filter((s) => cat === "Todos" || s.categoria === cat),
    [activos, cat],
  );
  const equipo = estilistas.filter((e) => e.activo !== false);
  const prods = productos.filter(
    (p) => p.activo !== false && Number(p.stock) > 0,
  );

  const reservar = (s) => {
    setPreSel(s?.id || null);
    document.getElementById("reserva")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="pub">
      {modoDemo && (
        <div className="demo-bar">
          <span>
            Modo demostración activo · Los datos se almacenan localmente en tu
            navegador ·
          </span>{" "}
          <a href="#admin" className="demo-link">
            Acceder al Panel Admin
          </a>
        </div>
      )}

      {/* Navegación Superior */}
      <header className="pub-nav">
        <a href="#inicio" className="logo">
          <span className="logo-main">{NEGOCIO.nombre}</span>
          <small className="logo-sub">{NEGOCIO.slogan}</small>
        </a>

        <button
          className="burger"
          onClick={() => setMenu(!menu)}
          aria-label="Abrir menú de navegación"
          aria-expanded={menu}
        >
          ☰
        </button>

        <nav className={menu ? "open" : ""} onClick={() => setMenu(false)}>
          <a href="#servicios">Servicios</a>
          <a href="#equipo">Estilistas</a>
          {prods.length > 0 && <a href="#productos">Productos</a>}
          <a href="#contacto">Ubicación</a>
          <a href="#reserva" className="btn btn-gold sm nav-cta">
            Reservar Cita
          </a>
        </nav>
      </header>

      {/* Sección Hero con Three.js 3D interactivo */}
      <section id="inicio" className="hero">
        <HeroScene3D />
        <div className="hero-inner">
          <div className="eyebrow-badge">
            <span className="badge-glow" />
            <span className="eyebrow-text">{NEGOCIO.slogan}</span>
          </div>

          <h1 className="hero-heading">
            El arte de la precisión,
            <br />
            <em>el cuidado de tu estilo.</em>
          </h1>

          <p className="lead">{NEGOCIO.descripcion}</p>

          <div className="hero-cta">
            <button
              className="btn btn-gold shadow-gold"
              onClick={() => reservar(null)}
            >
              Reservar Turno Online
            </button>
            <a
              className="btn btn-ghost"
              href={linkWhatsApp(
                NEGOCIO.whatsapp,
                `Hola ${NEGOCIO.nombre}, quisiera consultar sobre disponibilidad y servicios.`,
              )}
              target="_blank"
              rel="noreferrer"
            >
              Consultar por WhatsApp
            </a>
          </div>

          <ul className="hero-facts">
            <li>
              <b>{activos.length || "12+"}</b>
              <span>Servicios de autor</span>
            </li>
            <li>
              <b>{equipo.length || "5"}</b>
              <span>Estilistas máster</span>
            </li>
            <li>
              <b>24/7</b>
              <span>Reserva inmediata</span>
            </li>
          </ul>
        </div>
      </section>

      {/* Carta de Servicios */}
      <section id="servicios" className="sec">
        <div className="sec-head">
          <p className="eyebrow">Carta de Tratamientos & Cortes</p>
          <h2>Servicios Exclusivos</h2>
          <p className="sec-desc">
            Técnicas de precisión, productos profesionales y atención
            personalizada para cada estilo.
          </p>
        </div>

        <div className="chips">
          {cats.map((c) => (
            <button
              key={c}
              type="button"
              className={"chip" + (c === cat ? " on" : "")}
              onClick={() => setCat(c)}
            >
              {c}
            </button>
          ))}
        </div>

        <div className="serv-grid">
          {lista.map((s) => (
            <article key={s.id} className="serv-card">
              {s.imagen && (
                <div className="serv-img-wrap">
                  <img src={s.imagen} alt={s.nombre} loading="lazy" />
                  <span className="serv-tag-overlay">{s.categoria}</span>
                </div>
              )}
              <div className="serv-body">
                {!s.imagen && <span className="tag">{s.categoria}</span>}
                <h3>{s.nombre}</h3>
                <p>
                  {s.descripcion ||
                    "Servicio profesional con acabados de alta definición."}
                </p>
                <div className="serv-foot">
                  <div>
                    <b className="price">{money(s.precio)}</b>
                    <small> · {s.duracion} min</small>
                  </div>
                  <button
                    type="button"
                    className="btn btn-gold sm"
                    onClick={() => reservar(s)}
                  >
                    Reservar
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* Sección Equipo */}
      <section id="equipo" className="sec alt">
        <div className="sec-head">
          <p className="eyebrow">Especialistas del Salón</p>
          <h2>Manos Maestras</h2>
          <p className="sec-desc">
            Profesionales apasionados por la estética y el detalle impecable.
          </p>
        </div>
        <div className="team">
          {equipo.map((e) => (
            <div key={e.id} className="member card">
              <div className="member-avatar-wrap">
                {e.foto ? (
                  <img src={e.foto} alt={e.nombre} loading="lazy" />
                ) : (
                  <div className="avatar xl">{iniciales(e.nombre)}</div>
                )}
              </div>
              <h3>{e.nombre}</h3>
              <p className="member-role">
                {e.especialidad || "Estilista & Barbero"}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Productos (si hay catálogo) */}
      {prods.length > 0 && (
        <section id="productos" className="sec">
          <div className="sec-head">
            <p className="eyebrow">Línea de Mantenimiento</p>
            <h2>Productos para Llevar a Casa</h2>
          </div>
          <div className="prod-grid">
            {prods.map((p) => (
              <div key={p.id} className="prod card">
                {p.imagen ? (
                  <img src={p.imagen} alt={p.nombre} loading="lazy" />
                ) : (
                  <div className="prod-ph">✦</div>
                )}
                <h4>{p.nombre}</h4>
                <b className="price">{money(p.precio)}</b>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Sección de Reserva en Línea */}
      <section id="reserva" className="sec reserva-sec">
        <div className="sec-head center">
          <p className="eyebrow">Agendamiento Inmediato</p>
          <h2>Reserva tu Cita en Línea</h2>
          <p className="sec-desc">
            Elige tu servicio, fecha y horario preferido. Confirmación
            garantizada en pocos segundos.
          </p>
        </div>
        <Reserva
          servicios={activos}
          estilistas={equipo}
          preSel={preSel}
          onOpenLegal={(type) => setLegalModal(type)}
        />
      </section>

      {/* Sección Contacto y Ubicación */}
      <section id="contacto" className="sec alt">
        <div className="contact-editorial">
          <div className="contact-info-panel">
            <p className="eyebrow">Visita nuestro salón</p>
            <h2>{NEGOCIO.nombre}</h2>
            <div className="contact-points">
              <div className="c-point">
                <span className="c-icon">📍</span>
                <div>
                  <strong>Dirección</strong>
                  <p>{NEGOCIO.direccion}</p>
                </div>
              </div>
              <div className="c-point">
                <span className="c-icon">🕘</span>
                <div>
                  <strong>Horarios de Atención</strong>
                  <p>{NEGOCIO.horario.texto}</p>
                </div>
              </div>
              <div className="c-point">
                <span className="c-icon">📞</span>
                <div>
                  <strong>Contacto Directo</strong>
                  <p>{NEGOCIO.telefono}</p>
                </div>
              </div>
            </div>

            <div className="hero-cta" style={{ marginTop: 24 }}>
              <a
                className="btn btn-gold"
                href={NEGOCIO.mapaUrl}
                target="_blank"
                rel="noreferrer"
              >
                Cómo llegar (Google Maps)
              </a>
              <a
                className="btn btn-ghost dark"
                href={NEGOCIO.instagram}
                target="_blank"
                rel="noreferrer"
              >
                Instagram
              </a>
              <a
                className="btn btn-ghost dark"
                href={NEGOCIO.facebook}
                target="_blank"
                rel="noreferrer"
              >
                Facebook
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Footer Editorial con Enlaces Legales y Acceso Personal */}
      <footer className="pub-foot">
        <div className="foot-content">
          <div className="foot-brand">
            <span className="foot-logo">{NEGOCIO.nombre}</span>
            <p className="foot-slogan">{NEGOCIO.slogan}</p>
          </div>

          <div className="foot-links">
            <button
              type="button"
              className="foot-btn-link"
              onClick={() => setLegalModal("privacidad")}
            >
              Política de Privacidad
            </button>
            <span className="foot-sep">·</span>
            <button
              type="button"
              className="foot-btn-link"
              onClick={() => setLegalModal("terminos")}
            >
              Términos de Servicio & Tolerancia
            </button>
            <span className="foot-sep">·</span>
            <a href="#admin" className="foot-btn-link admin-entry">
              Acceso Personal (Admin)
            </a>
          </div>

          <p className="foot-copy">
            © {new Date().getFullYear()} {NEGOCIO.nombre}. Todos los derechos
            reservados.
          </p>
        </div>
      </footer>

      {/* Botón flotante de WhatsApp */}
      <a
        className="wa-float"
        href={linkWhatsApp(
          NEGOCIO.whatsapp,
          `Hola ${NEGOCIO.nombre}, quisiera consultar sobre disponibilidad y citas.`,
        )}
        target="_blank"
        rel="noreferrer"
        aria-label="Contactar por WhatsApp"
      >
        <span aria-hidden="true">
          <img
            src="https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg"
            alt=""
            width="28"
            height="28"
          />
        </span>
      </a>

      {/* Modal Legal */}
      <LegalModal type={legalModal} onClose={() => setLegalModal(null)} />
    </div>
  );
}
