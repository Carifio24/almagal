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
</style>
