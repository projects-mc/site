<script>
    const inventoryRows = ["Player", "6 row chest"];
	import Admonition from '#lib/components/admonition.svelte';
</script>
<h1>Skript Inventory IDs</h1>
<p>
    Skript's inventory ID's are slightly different than Bukkit/Java.
    Each inventory starts at 1 (instead of 0) and has some slightly
    different values (e.g. offhands).

    Ideally, you should memorize the slot IDs so you won't
    need this reference sheet. However, it still may be useful for
    visualizing mockup inventory layouts while designing interfaces.
</p>


<label for="inventorysize">Select Inventory Type:</label>
<select name="inventorysize" id="inventorysize">
    {#each inventoryRows as item}
        <option value={item}>{item}</option>
    {/each}
</select>

<Admonition error>Tool not finished, please check back later</Admonition>