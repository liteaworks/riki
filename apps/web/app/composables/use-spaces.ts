import type { SpaceListItem } from '#shared/types/space'

export function useSpaces() {
	const { t } = useI18n()
	const toast = useToast()
	const appConfig = useAppConfig()

	const spaces = ref<SpaceListItem[]>([])
	const pending = ref(false)

	async function load() {
		if (pending.value) return
		pending.value = true
		try {
			spaces.value = await $fetch<SpaceListItem[]>('/api/spaces')
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

	async function deleteSpace(id: string) {
		try {
			await $fetch(`/api/spaces/${id}`, { method: 'DELETE' })
			spaces.value = spaces.value.filter((space) => space.id !== id)
			return true
		} catch (error) {
			toast.add({
				title: t('common.actionFailed', { action: t('common.delete') }),
				description: error instanceof Error ? error.message : undefined,
				color: 'error',
			})
			return false
		}
	}

	function iconForSpace(space: SpaceListItem) {
		return space.noteCount > 0 ? appConfig.ui.icons.folderOpen : appConfig.ui.icons.folder
	}

	onMounted(() => {
		void load()
	})

	return { spaces, load, addSpace, renameSpace, deleteSpace, iconForSpace }
}
