<script lang="ts">
  import { t } from "$lib/i18n";
</script>

<section class="about-header">
  <h1>{$t('common.about.title')}</h1>
  <p class="intro">{@html $t('common.about.intro')}</p>
</section>

<section class="about-section">
  <div class="about-card">
    <h2>{$t('common.about.whyTitle')}</h2>
    <p>{$t('common.about.whyText')}</p>
  </div>

  <div class="about-card">
    <h2>{$t('common.about.offerTitle')}</h2>
    <ul class="centered-list">
      <li>{@html $t('common.about.offer1')}</li>
      <li>{@html $t('common.about.offer2')}</li>
      <li>{@html $t('common.about.offer3')}</li>
    </ul>
  </div>
</section>

<style>
  /* Заголовок и описание */
  .about-header {
    max-width: 800px;
    margin: 3rem auto 2rem auto;
    text-align: left;    padding: 0 1rem;
  }

  h1 {
    font-size: 2.2rem;
    font-weight: 700;
    color: #0b3954;
    margin-bottom: 1rem;
  }

  .intro {
    font-size: 1.1rem;
    color: #475569;
    line-height: 1.6;
  }

  /* Карточки */
  .about-section {
    max-width: 900px;
    margin: 0 auto 3rem auto;
    padding: 0 1rem;
    display: flex;
    flex-direction: column;
    gap: 2rem;
  }

  .about-card {
    background: white;
    padding: 2rem;
    border-radius: 16px;
    text-align: center;
    box-shadow: 0 4px 20px rgba(0,0,0,0.05);
    border: 1px solid #ffffff;
    transition: transform 0.25s ease, box-shadow 0.25s ease;
        text-align: left;
  }

  .about-card:hover {
    transform: translateY(-3px);
    box-shadow: 0 6px 15px rgba(0,0,0,0.1);
  }

  .about-card h2 {
    font-size: 1.4rem;
    font-weight: 700;
    color: #0b3954;
    margin-bottom: 1rem;
  }

  .about-card p {
    color: #475569;
    line-height: 1.55;
    font-size: 1rem;
    margin-bottom: 1rem;
    
  }

  .centered-list {
    list-style: none;
    padding: 0;
    margin: 0 auto;
    max-width: 500px;
    text-align: left;
  }

  .centered-list li {
    margin-bottom: 0.8rem;
    font-size: 0.98rem;
    color: #475569;
    line-height: 1.45;
    padding-left: 1rem;
    position: relative;
    
  }

  .centered-list li::before {
    content: "•";
    position: absolute;
    left: 0;
    top: 0;
    font-size: 1.2rem;
    color: #0b3954;
  }

  @media (max-width: 700px) {
    .about-card {
      padding: 1.5rem;
    }
  }
</style>
