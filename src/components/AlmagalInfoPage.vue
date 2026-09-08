<template>
  <div class="ag-info flex-1-1">
    <div class="almagal-logo">
      <img class="almagal-logo-img" :src="almagalImage" alt="">
      <div>
        ALMAGAL
      </div>
    </div>
    <div>
      <p>
        The ALMAGAL survey is a large program at the Atacama Large Millimeter/submillimeter Array (ALMA) over 1000 dense clumps c
        that were believed capable of producing massive protostars. 
      </p>
      <ul>
        <li>
          Press the "Tour" button to learn more about the ALMAGAL survey and massive star formation
        </li>
        <li>
          Press the "Search" button to go to specific ALMAGAL sources
        </li>
        <li>
          Press "Help" to go to the user guide (which contains more detail then here)
        </li>
        <li>
          Press the "Explore" button to filter ALMAGAL sources and change the background and show comparison images on the sky
        </li>
      </ul>
    </div>
    <a
      class="learn-more-card"
      href="https://www.almagal.org"
      target="_blank"
      rel="noopener noreferrer"
    >
      <span class="learn-more-text">
        Learn More About ALMAGAL
      </span>
      <img
        src="https://battersby-physics.media.uconn.edu/wp-content/uploads/sites/2230/2020/09/ALMAGAL_Logo1_SM.jpg"
        alt="ALMAGAL logo"
        class="learn-more-logo"
      />
    </a>
  </div>
</template>


<script setup>
import almagalImage from '@/assets/almagal-header.png';
</script>


<style>

@font-face {
  font-family: "Highway Gothic Narrow";
  src: url("../assets/HighwayGothicNarrow.ttf") format("truetype");
}

@font-face {
  font-family: "Segoe UI Semibold";
  src: url("../assets/Segoe UI Semibold.ttf") format("truetype");
  font-weight: 600;
}

.ag-info {
  font-size: 1rem;
  display: flex;
  flex-direction: column;
  
}
.almagal-logo {
  --size: 2.75em;

  flex: 1 1 auto;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  gap: 0.5em;
  font-family: "Segoe UI Semibold", sans-serif;
  font-size: var(--size);
  font-weight: bold;
  color: white;
  margin-bottom: 1rem;
}

.almagal-logo .almagal-logo-img {
  height: calc(0.6 * var(--size));
}

/* was the "Learn More" button in the top-right of the view; now the link out
   to almagal.org at the foot of this page. Styles came over with it. */
.learn-more-card {

  flex-direction: row;
  display: flex;
  align-items: center;
  gap: 0.75em;
  padding: 0.5em 0.75em;

  text-align: left;
  font-size: 0.95em;
  font-weight: bold;

  backdrop-filter: blur(10px);
  background-color: rgba(0, 0, 0, 0.364);

  border: 1px solid white;
  border-radius: 8px;
  cursor: pointer;

  width: fit-content;
  max-width: 250px;
  pointer-events: auto;

  align-self:center;
  color: inherit;
  text-decoration: none;
}

.learn-more-text {
  flex: 1;
}

.learn-more-logo {
  height: 2.75em;
  width: auto;
  border-radius: 4px;
}
</style>
