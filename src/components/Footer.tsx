/**
 * Pied de page — même structure et même habillage que tisite.re.
 * Les liens légaux pointent vers le site principal : l'annuaire est une page
 * de TiSite, il n'a pas ses propres mentions légales.
 */

const NAV = [
  // `./` : plus de routeur ici, `#/` ne menait nulle part.
  { label: 'Accueil', href: './' },
  { label: 'Le site TiSite', href: 'https://tisite.re' },
  { label: 'Nous écrire', href: 'mailto:info@tisite.re' },
]

const LEGAL = [
  { label: 'Mentions légales', href: 'https://tisite.re/mentions-legales/' },
  { label: 'Politique de confidentialité', href: 'https://tisite.re/politique-de-confidentialite/' },
  { label: 'Conditions générales', href: 'https://tisite.re/conditions-generales/' },
]

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="container">
        <div className="top">
          <div>
            <p className="brand-name">TiSite</p>
            <p className="about">
              L'assistant des commerces et prestataires de La Réunion — une page TiSite.
              Posez votre question, il répond.
            </p>
          </div>
          <div>
            <h2>L'assistant</h2>
            <ul>
              {NAV.map((item) => (
                <li key={item.href}>
                  <a href={item.href}>{item.label}</a>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h2>Légal</h2>
            <ul>
              {LEGAL.map((item) => (
                <li key={item.href}>
                  <a href={item.href}>{item.label}</a>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h2>Coordonnées</h2>
            <ul>
              <li>
                <a href="mailto:info@tisite.re">info@tisite.re</a>
              </li>
              <li>
                <a href="tel:+262693478915">+262 693 478 915</a>
              </li>
              <li>
                Saint-Pierre
                <br />
                97410 La Réunion
              </li>
            </ul>
          </div>
        </div>
        <div className="bottom">
          <span>© {new Date().getFullYear()} TiSite — tisite.re</span>
          <span>
            {LEGAL.map((item, i) => (
              <span key={item.href}>
                {i > 0 && ' · '}
                <a href={item.href}>{item.label}</a>
              </span>
            ))}
          </span>
        </div>
      </div>
    </footer>
  )
}
