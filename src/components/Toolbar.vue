/**
 * Top toolbar container component that combines tool selector and zoom controls
 */

<script setup lang="ts"></script>

<template>
  <div
    class="fixed top-8 left-0 right-0 flex items-center justify-between px-8 z-50"
  >
    <div class="flex items-center">
      <MenuDropdown />
    </div>
    <div class="flex items-center">
      <ToolSelector />
    </div>
    <div class="flex items-center">
      <ZoomControls />
    </div>
  </div>
</template>
