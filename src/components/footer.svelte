<footer>
  <div class="container">
    <!-- ЛОГО -->
    <div class="footer-logo">
      <img src="/assets/images/cbc/logo-cbc-dark.svg" alt="Logo" />
      <span>Cyprus Business Club</span>
    </div>

    <!-- НАВИГАЦИЯ -->
    <nav class="footer-nav">
      <a href="#events">Events</a>
      <a href="#partners">Partners</a>
      <a href="#members">Members</a>
      <a href="#technologies">Technologies</a>
      <a href="#about">About</a>
    </nav>

    <!-- СОЦСЕТИ -->
    <div class="socials">
      <a href="#"><img src="https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/linkedin.svg" alt="LinkedIn" /></a>
      <a href="#"><img src="https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/instagram.svg" alt="Instagram" /></a>
      <a href="#"><img src="https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/twitter.svg" alt="Twitter" /></a>
    </div>
  </div>

  <div class="bottom-bar">
    <p>© 2026 Cyprus Business Club. All rights reserved.• Designed by
      <a
        href="https://keyscalelab.com/"
        target="_blank"
        rel="noopener noreferrer"
      >
        KeyScaleLab
      </a></p>
  </div>
</footer>

<style>
  footer {
    background: #4f69ff;
    color: white;
    padding-top: 2rem;
  }

  .container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 1rem 1.5rem 1rem;
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 1.5rem;
  }

  /* ЛОГО */
  .footer-logo {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    font-weight: 600;
    font-size: 1.1rem;
  }

  .footer-logo img {
    width: 36px;
    height: 36px;
    object-fit: contain;
    filter: brightness(0) invert(1);
  }

  /* НАВИГАЦИЯ */
  .footer-nav {
    display: flex;
    gap: 1.5rem;
    flex-wrap: wrap;
    justify-content: center;
  }

  .footer-nav a {
    color: #e2e8f0;
    text-decoration: none;
    font-size: 0.9rem;
    transition: color 0.2s ease;
  }

  .footer-nav a:hover {
    color: #ffffff;
  }

  /* СОЦСЕТИ */
  .socials {
    display: flex;
    gap: 1rem;
  }

  .socials a img {
    width: 22px;
    height: 22px;
    filter: brightness(0) invert(1);
    opacity: 0.85;
    transition: opacity 0.2s ease, transform 0.2s ease;
  }

  .socials a:hover img {
    opacity: 1;
    transform: scale(1.1);
  }

  /* НИЖНЯЯ ПОЛОСА */
  .bottom-bar {
    border-top: 1px solid rgba(255, 255, 255, 0.15);
    text-align: center;
    padding: 0.8rem 1rem;
    background: #4f69ff;
  }

  .bottom-bar p {
    margin: 0;
    font-size: 0.85rem;
    color: #cbd5e1;
  }

  /* АДАПТИВ */
  @media (max-width: 800px) {
    .container {
      flex-direction: column;
      align-items: center;
      text-align: center;
    }

    .footer-nav {
      justify-content: center;
    }
  }
</style>
