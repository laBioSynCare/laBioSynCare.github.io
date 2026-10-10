<script>
  import ManualChapter from '../../../ui/manual/ManualChapter.svelte'
  let { data } = $props()
</script>

<ManualChapter chapter={data.chapter} />
