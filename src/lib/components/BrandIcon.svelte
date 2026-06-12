<script lang="ts">
	import { siGithub, siGoogle } from 'simple-icons';

	let { name, size = 18, color = 'currentColor' }: { name: string; size?: number; color?: string } = $props();

	const icons: Record<string, { path: string }> = {
		github: siGithub,
		google: siGoogle,
	};

	const icon = $derived(icons[name]);
</script>

{#if icon}
	<svg width={size} height={size} viewBox="0 0 24 24" fill={color} aria-hidden="true">
		<path d={icon.path} />
	</svg>
{/if}
