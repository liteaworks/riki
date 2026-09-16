<script setup lang="ts">
const ui = {
	...(isTauri && {
		sidebar: {
			slots: {
				gap: 'h-[calc(100%-var(--ui-header-height))]',
				container:
					'absolute top-(--ui-header-height) bottom-0 h-[calc(100%-var(--ui-header-height))]',
			},
		},
	}),
}
</script>

<template>
	<UApp>
		<UTheme :ui="ui">
			<LayoutHeader v-if="isTauri" />
			<main :class="isTauri ? 'h-[calc(100vh-var(--ui-header-height))]' : 'h-svh'">
				<NuxtLayout>
					<NuxtPage />
				</NuxtLayout>
			</main>
		</UTheme>
	</UApp>
</template>
