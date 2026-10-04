<script setup lang="ts">
import type { DropdownMenuItem } from '@nuxt/ui'

defineProps<{ items: DropdownMenuItem[][] }>()

const appConfig = useAppConfig()
</script>

<template>
	<div
		class="pointer-events-none -my-0.5 -mr-1.5 flex opacity-0 transition-opacity group-hover:pointer-events-auto group-hover:opacity-100 group-data-[state=collapsed]/sidebar:hidden has-data-[state=open]:opacity-100"
	>
		<UDropdownMenu :items="items" :content="{ align: 'start' }" :modal="false">
			<UButton
				as="div"
				:icon="appConfig.ui.icons.ellipsis"
				color="neutral"
				variant="ghost"
				size="xs"
				class="text-muted hover:bg-accented/50 hover:text-highlighted data-[state=open]:bg-accented/50"
				@click.stop
			/>
		</UDropdownMenu>
	</div>
</template>
