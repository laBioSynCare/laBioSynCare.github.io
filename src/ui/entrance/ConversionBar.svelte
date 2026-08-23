<script>
  // The two social-conversion actions. Their canonical spot is door ④ ("Join
  // & partner"), which renders them itself from the entrance's own door data —
  // this component is *only* the mobile sticky bar shown once the hero has
  // scrolled away, and `variant="sticky"` is its single call site. (The
  // comment here used to say it was the door's implementation too, which it
  // stopped being when the duplicated hero/footer bars were cut.) See
  // PUBLIC_ENTRANCE.md.
  import { W3C_GROUP_URL } from '../externalLinks.js'

  const { variant = 'sticky', onContribute } = $props()
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
