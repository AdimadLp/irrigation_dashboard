<template>
  <div id="app">
    <router-view></router-view>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'

export default defineComponent({
  name: 'App'
})
</script>

<style>
html,
body,
#app {
  height: 100%;
  margin: 0;
  padding: 0%;
  font-family: 'Avenir', Helvetica, Arial, sans-serif;
}
</style>
