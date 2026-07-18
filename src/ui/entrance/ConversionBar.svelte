<script>
  // The two social-conversion actions. Live inline in door ④ ("Join &
  // partner") as their canonical spot; this component is otherwise only
  // used as the mobile sticky bar once the hero has scrolled away — see
  // PUBLIC_ENTRANCE.md.
  const { variant = 'sticky', onContribute } = $props()

  const W3C_GROUP_URL = 'https://www.w3.org/community/sstim/'
</script>

<div class="conversion-bar {variant}">
  <a role="button" href={W3C_GROUP_URL} rel="external">Join the W3C group</a>
  <button type="button" class="secondary" onclick={onContribute}>Contribute a protocol</button>
</div>

<style>
  .conversion-bar {
    display: flex;
    gap: 0.6rem;
    flex-wrap: wrap;
  }

  .conversion-bar.sticky {
    justify-content: center;
    margin: 0;
  }

  .conversion-bar.sticky a[role='button'],
  .conversion-bar.sticky button {
    font-size: 0.8rem;
    padding: 0.4rem 0.85rem;
  }
</style>
