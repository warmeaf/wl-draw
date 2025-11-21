<template>
  <div
    class="fixed top-8 left-0 right-0 flex items-center justify-between px-8 z-50"
  >
    <div class="flex items-center gap-2">
      <MenuDropdown />
      <UndoRedoButtons />
    </div>
    <div class="flex items-center">
      <ToolSelector />
    </div>
    <div class="flex items-center">
      <ZoomControls />
    </div>
  </div>
</template>
