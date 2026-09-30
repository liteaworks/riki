import { sidebarKind } from '#shared/types/view'
import type { SidebarEntry, SidebarKind, SidebarTarget, View, ViewFilter } from '#shared/types/view'
import type { SpaceListItem } from '#shared/types/space'
import type { TagListItem } from '#shared/types/tag'

export type PinnedTarget =
	| { entry: SidebarEntry; kind: 'view'; id: string; label: string; view: View }
	| { entry: SidebarEntry; kind: 'space'; id: string; label: string; space: SpaceListItem }
	| { entry: SidebarEntry; kind: 'tag'; id: string; label: string; tag: TagListItem }

export const useViewStore = defineStore('view', () => {
	const views = ref<View[]>([])
	const pinned = ref<SidebarEntry[]>([])
	const target = ref<SidebarTarget | null>({ kind: 'library', id: 'library' })
	const loaded = ref(false)
	const pending = ref(false)

	const spaceStore = useSpaceStore()
	const tagStore = useTagStore()

	const baseFilter = computed<ViewFilter>(() => {
		const current = target.value
		if (!current) return {}
		if (current.kind === 'library') return {}
		if (current.kind === 'inbox') return { spaceId: null }
		if (current.kind === sidebarKind.view) {
			return views.value.find((view) => view.id === current.id)?.filter ?? {}
		}
		if (current.kind === sidebarKind.space) return { spaceId: current.id }
		return { tagIds: [current.id] }
	})

	function isPinned(kind: SidebarKind, id: string) {
		return pinned.value.some((entry) => entry.kind === kind && entry.targetId === id)
	}

	const pinnedTargets = computed<PinnedTarget[]>(() =>
		pinned.value
			.map((entry) => {
				const id = entry.targetId
				if (entry.kind === sidebarKind.view) {
					const view = views.value.find((item) => item.id === id)
					return view ? { entry, kind: entry.kind, id, label: view.name, view } : null
				}
				if (entry.kind === sidebarKind.space) {
					const space = spaceStore.spaces.find((item) => item.id === id)
					return space ? { entry, kind: entry.kind, id, label: space.name, space } : null
				}
				const tag = tagStore.tags.find((item) => item.id === id)
				return tag ? { entry, kind: entry.kind, id, label: tag.name, tag } : null
			})
			.filter((item) => item !== null),
	)

	const unpinnedViews = computed(() =>
		views.value.filter((view) => !isPinned(sidebarKind.view, view.id)),
	)
	const unpinnedSpaces = computed(() =>
		spaceStore.spaces.filter((space) => !isPinned(sidebarKind.space, space.id)),
	)
	const unpinnedTags = computed(() =>
		tagStore.tags.filter((tag) => !isPinned(sidebarKind.tag, tag.id)),
	)

	async function refresh() {
		const [viewRows, sidebarRows] = await Promise.all([
			$fetch<View[]>('/api/views'),
			$fetch<SidebarEntry[]>('/api/sidebar'),
		])
		views.value = viewRows
		pinned.value = sidebarRows
	}

	async function load() {
		if (import.meta.server || loaded.value || pending.value) return
		pending.value = true
		try {
			await refresh()
			loaded.value = true
		} catch {
		} finally {
			pending.value = false
		}
	}

	function select(next: SidebarTarget | null) {
		target.value = next
	}

	async function createView(name: string, filter: ViewFilter) {
		const view = await $fetch<View>('/api/views', { method: 'POST', body: { name, filter } })
		views.value = [...views.value, view]
		return view
	}

	async function saveView(id: string, name: string, filter: ViewFilter) {
		const updated = await $fetch<View>(`/api/views/${id}`, {
			method: 'PATCH',
			body: { name, filter },
		})
		views.value = views.value.map((view) => (view.id === id ? updated : view))
		return updated
	}

	async function deleteView(id: string) {
		await $fetch(`/api/views/${id}`, { method: 'DELETE' })
		views.value = views.value.filter((view) => view.id !== id)
		pinned.value = pinned.value.filter(
			(entry) => !(entry.kind === sidebarKind.view && entry.targetId === id),
		)
		if (target.value?.kind === sidebarKind.view && target.value.id === id) {
			target.value = { kind: 'library', id: 'library' }
		}
	}

	async function pin(kind: SidebarKind, id: string) {
		pinned.value = await $fetch<SidebarEntry[]>('/api/sidebar', {
			method: 'POST',
			body: { kind, targetId: id },
		})
	}

	async function unpin(id: string) {
		await $fetch(`/api/sidebar/${id}`, { method: 'DELETE' })
		pinned.value = pinned.value.filter((entry) => entry.id !== id)
	}

	async function move(id: string, position: number) {
		await $fetch(`/api/sidebar/${id}`, { method: 'PATCH', body: { position } })
		await refresh()
	}

	return {
		views,
		pinned,
		target,
		loaded,
		pending,
		baseFilter,
		pinnedTargets,
		unpinnedViews,
		unpinnedSpaces,
		unpinnedTags,
		isPinned,
		load,
		refresh,
		select,
		createView,
		saveView,
		deleteView,
		pin,
		unpin,
		move,
	}
})
