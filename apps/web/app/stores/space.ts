import type { SpaceListItem } from '#shared/types/space'

export const useSpaceStore = defineStore('space', () => {
	const { $i18n } = useNuxtApp()
	const toast = useToast()
	const appConfig = useAppConfig()

	const spaces = ref<SpaceListItem[]>([])
	const pending = ref(false)
	const loaded = ref(false)

	async function load(options?: { force?: boolean }) {
		if (pending.value) return
		if (loaded.value && !options?.force) return
		pending.value = true
		try {
			const rows = await $fetch<SpaceListItem[]>('/api/spaces')
			// Merged, not replaced: a space created while this was in flight is absent
			// from the response and would vanish from the sidebar until reload.
			const byId = new Map(spaces.value.map((space) => [space.id, space]))
			for (const row of rows) byId.set(row.id, row)
			spaces.value = [...byId.values()]
			loaded.value = true
		} catch {
			// A preload must not break the page; `loaded` stays false to retry.
		} finally {
			pending.value = false
		}
	}

	function addSpace(space: { id: string; name: string }) {
		spaces.value.push({ id: space.id, name: space.name, noteCount: 0 })
	}

	function renameSpace(space: { id: string; name: string }) {
		const index = spaces.value.findIndex((item) => item.id === space.id)
		if (index === -1) return
		spaces.value[index] = {
			id: space.id,
			name: space.name,
			noteCount: spaces.value[index]?.noteCount ?? 0,
		}
	}

	function removeSpace(id: string) {
		spaces.value = spaces.value.filter((space) => space.id !== id)
	}

	async function deleteSpace(id: string) {
		try {
			await $fetch(`/api/spaces/${id}`, { method: 'DELETE' })
			removeSpace(id)
			return true
		} catch (error) {
			toast.add({
				title: $i18n.t('common.actionFailed', { action: $i18n.t('common.delete') }),
				description: error instanceof Error ? error.message : undefined,
				color: 'error',
			})
			return false
		}
	}

	function iconForSpace(space: SpaceListItem) {
		return space.noteCount > 0 ? appConfig.ui.icons.folderOpen : appConfig.ui.icons.folder
	}

	return {
		spaces,
		pending,
		loaded,
		load,
		addSpace,
		renameSpace,
		removeSpace,
		deleteSpace,
		iconForSpace,
	}
})
