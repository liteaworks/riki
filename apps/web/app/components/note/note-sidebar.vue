<script setup lang="ts">
import type { ContextMenuItem, DropdownMenuItem, NavigationMenuItem } from '@nuxt/ui'
import { LazyDialogModal, LazyNoteSpaceFormModal, LazyNoteViewFormModal } from '#components'
import type { SpaceListItem } from '#shared/types/space'
import type { TagListItem } from '#shared/types/tag'
import { sidebarKind } from '#shared/types/view'
import type { SidebarKind } from '#shared/types/view'
import type { PinnedTarget } from '~/stores/view'

const { t } = useI18n()
const appConfig = useAppConfig()
const overlay = useOverlay()
const session = useAuth().useSession()

const spaceStore = useSpaceStore()
const tagStore = useTagStore()
const viewStore = useViewStore()
const { spaces } = storeToRefs(spaceStore)
const { tags } = storeToRefs(tagStore)
const { target, pinnedTargets, unpinnedViews, unpinnedSpaces, unpinnedTags } =
	storeToRefs(viewStore)

onMounted(() => {
	void spaceStore.load()
	void tagStore.load()
	void viewStore.load()
})

const spaceFormModal = overlay.create(LazyNoteSpaceFormModal)
const viewFormModal = overlay.create(LazyNoteViewFormModal)
const confirmDialog = overlay.create(LazyDialogModal)

const signedIn = computed(() => Boolean(session.value.data?.user?.id))

const contextItem = ref<{ kind: SidebarKind; id: string } | null>(null)
const open = defineModel<boolean>('open', { default: true })
const contextPinnedId = computed(() =>
	contextItem.value
		? (viewStore.pinned.find(
				(entry) =>
					entry.kind === contextItem.value!.kind && entry.targetId === contextItem.value!.id,
			)?.id ?? null)
		: null,
)

const targetActions = computed<ContextMenuItem[][]>(() =>
	contextPinnedId.value
		? [
				[
					{
						label: t('view.unpin'),
						icon: appConfig.ui.icons.pinOff,
						onSelect: () => {
							if (contextPinnedId.value) void viewStore.unpin(contextPinnedId.value)
						},
					},
				],
			]
		: [],
)

function isActive(kind: SidebarTarget['kind'], id: string) {
	return target.value?.kind === kind && target.value.id === id
}

function onContextMenu(event: MouseEvent) {
	const element = event.target
	if (!(element instanceof HTMLElement)) return
	const row = element.closest<HTMLElement>('[data-item-kind][data-item-id]')
	contextItem.value = row
		? { kind: row.dataset.itemKind as SidebarKind, id: row.dataset.itemId! }
		: null
}

function openCreateSpace() {
	spaceFormModal.open({ space: null })
}

function openEditSpace(space: SpaceListItem) {
	spaceFormModal.open({ space })
}

function openDeleteSpace(space: SpaceListItem) {
	confirmDialog.open({
		title: t('space.deleteTitle'),
		description: t('space.deleteDescription'),
		icon: appConfig.ui.icons.trash,
		destructive: true,
		onConfirm: () => {
			void spaceStore.deleteSpace(space.id)
		},
	})
}

function openCreateView() {
	viewFormModal.open({ view: null, filter: { ...useNoteStore().activeFilter } })
}

function openEditView(id: string) {
	const view = viewStore.views.find((item) => item.id === id)
	if (view) viewFormModal.open({ view, filter: view.filter })
}

function openDeleteView(id: string) {
	const view = viewStore.views.find((item) => item.id === id)
	if (!view) return
	confirmDialog.open({
		title: t('view.deleteTitle'),
		description: t('view.deleteDescription', { name: view.name }),
		icon: appConfig.ui.icons.trash,
		destructive: true,
		onConfirm: () => {
			void viewStore.deleteView(id)
		},
	})
}

function spaceActions(space: SpaceListItem): DropdownMenuItem[][] {
	return [
		[
			{
				label: t('common.edit'),
				icon: appConfig.ui.icons.edit,
				onSelect: () => openEditSpace(space),
			},
		],
		[pinAction(sidebarKind.space, space.id)],
		[
			{
				label: t('common.delete'),
				icon: appConfig.ui.icons.trash,
				color: 'error' as const,
				onSelect: () => openDeleteSpace(space),
			},
		],
	]
}

function viewActions(view: { id: string; name: string }): DropdownMenuItem[][] {
	return [
		[pinAction(sidebarKind.view, view.id)],
		[
			{
				label: t('common.edit'),
				icon: appConfig.ui.icons.edit,
				onSelect: () => openEditView(view.id),
			},
		],
		[
			{
				label: t('common.delete'),
				icon: appConfig.ui.icons.trash,
				color: 'error' as const,
				onSelect: () => openDeleteView(view.id),
			},
		],
	]
}

function unpin(kind: SidebarKind, id: string) {
	const entry = viewStore.pinned.find((row) => row.kind === kind && row.targetId === id)
	if (entry) void viewStore.unpin(entry.id)
}

function pinAction(kind: SidebarKind, id: string): DropdownMenuItem {
	return viewStore.isPinned(kind, id)
		? {
				label: t('view.unpin'),
				icon: appConfig.ui.icons.pinOff,
				onSelect: () => unpin(kind, id),
			}
		: {
				label: t('view.pin'),
				icon: appConfig.ui.icons.pin,
				onSelect: () => void viewStore.pin(kind, id),
			}
}

function tagActions(tag: TagListItem): DropdownMenuItem[][] {
	return [
		[pinAction(sidebarKind.tag, tag.id)],
		[
			{
				label: t('common.delete'),
				icon: appConfig.ui.icons.trash,
				color: 'error' as const,
				onSelect: () => openDeleteTag(tag),
			},
		],
	]
}

function entryActions(entry: PinnedTarget): DropdownMenuItem[][] {
	if (entry.kind === sidebarKind.view) return viewActions(entry.view)
	if (entry.kind === sidebarKind.space) return spaceActions(entry.space)
	return tagActions(entry.tag)
}

function openDeleteTag(tag: TagListItem) {
	confirmDialog.open({
		title: t('tag.deleteTitle'),
		description: t('tag.deleteDescription', { name: tag.name }),
		icon: appConfig.ui.icons.trash,
		destructive: true,
		onConfirm: () => {
			const noteStore = useNoteStore()
			noteStore.tagFilter = noteStore.tagFilter.filter((id) => id !== tag.id)
			void tagStore.deleteTag(tag.id)
		},
	})
}

const builtinItems = computed<NavigationMenuItem[]>(() => [
	{
		label: t('note.library'),
		icon: appConfig.ui.icons.file,
		active: isActive('library', 'library'),
		'data-item-kind': 'library',
		'data-item-id': 'library',
		to: '/',
	},
	{
		label: t('note.inbox'),
		icon: appConfig.ui.icons.inbox,
		active: isActive('inbox', 'inbox'),
		'data-item-kind': 'inbox',
		'data-item-id': 'inbox',
		to: '/inbox',
	},
])

const pinnedItems = computed<NavigationMenuItem[]>(() =>
	pinnedTargets.value.map((entry) => ({
		label: entry.label,
		icon:
			entry.kind === sidebarKind.space
				? spaceStore.iconForSpace(entry.space!)
				: entry.kind === sidebarKind.tag
					? appConfig.ui.icons.hash
					: appConfig.ui.icons.file,
		active: isActive(entry.kind, entry.id),
		slot: `pin-${entry.entry.id}`,
		'data-item-kind': entry.kind,
		'data-item-id': entry.id,
		to: { path: '/', query: { [entry.kind]: entry.id } },
	})),
)

const items = computed<NavigationMenuItem[][]>(() => {
	const rows: NavigationMenuItem[][] = []

	rows.push([...builtinItems.value, ...pinnedItems.value])

	rows.push([
		{ label: t('view.label'), type: 'label', slot: 'views' },
		...unpinnedViews.value.map<NavigationMenuItem>((view) => ({
			label: view.name,
			icon: appConfig.ui.icons.file,
			active: isActive(sidebarKind.view, view.id),
			slot: `view-${view.id}`,
			'data-item-kind': sidebarKind.view,
			'data-item-id': view.id,
			to: { path: '/', query: { view: view.id } },
		})),
	])

	rows.push([
		{ label: t('space.label'), type: 'label', slot: 'spaces' },
		...unpinnedSpaces.value.map<NavigationMenuItem>((space) => ({
			label: space.name,
			icon: spaceStore.iconForSpace(space),
			active: isActive(sidebarKind.space, space.id),
			slot: `space-${space.id}`,
			'data-item-kind': sidebarKind.space,
			'data-item-id': space.id,
			to: { path: '/', query: { space: space.id } },
		})),
	])

	if (unpinnedTags.value.length) {
		rows.push([
			{ label: t('tag.label'), type: 'label', slot: 'tags' },
			...unpinnedTags.value.map<NavigationMenuItem>((tag) => ({
				label: tag.name,
				icon: appConfig.ui.icons.hash,
				active: isActive(sidebarKind.tag, tag.id),
				slot: `tag-${tag.id}`,
				'data-item-kind': sidebarKind.tag,
				'data-item-id': tag.id,
				to: { path: '/', query: { tag: tag.id } },
			})),
		])
	}

	return rows
})
</script>

<template>
	<LayoutSidebar v-model:open="open">
		<UContextMenu :items="targetActions" :disabled="!contextPinnedId">
			<div @contextmenu.capture="onContextMenu">
				<UNavigationMenu
					orientation="vertical"
					:items="items"
					:ui="{ link: 'overflow-hidden has-data-[state=open]:before:bg-elevated/50' }"
				>
					<template
						v-for="entry in pinnedTargets"
						:key="entry.entry.id"
						#[`pin-${entry.entry.id}-trailing`]
					>
						<NoteSidebarItemMenu :items="entryActions(entry)" />
					</template>

					<template #views-trailing>
						<div
							class="pointer-events-none -my-0.5 -mr-1.5 flex opacity-0 transition-opacity group-hover/sidebar:pointer-events-auto group-hover/sidebar:opacity-100 group-data-[state=collapsed]/sidebar:hidden"
						>
							<UTooltip :text="t('view.new')">
								<UButton
									v-if="signedIn"
									:icon="appConfig.ui.icons.plus"
									color="neutral"
									variant="ghost"
									size="xs"
									@click="openCreateView"
								/>
							</UTooltip>
						</div>
					</template>

					<template v-for="view in unpinnedViews" :key="view.id" #[`view-${view.id}-trailing`]>
						<NoteSidebarItemMenu :items="viewActions(view)" />
					</template>

					<template #spaces-trailing>
						<div
							class="pointer-events-none -my-0.5 -mr-1.5 flex opacity-0 transition-opacity group-hover/sidebar:pointer-events-auto group-hover/sidebar:opacity-100 group-data-[state=collapsed]/sidebar:hidden"
						>
							<UTooltip :text="t('space.new')">
								<UButton
									v-if="signedIn"
									:icon="appConfig.ui.icons.plus"
									color="neutral"
									variant="ghost"
									size="xs"
									@click="openCreateSpace"
								/>
							</UTooltip>
						</div>
					</template>

					<template v-for="space in unpinnedSpaces" :key="space.id" #[`space-${space.id}-trailing`]>
						<NoteSidebarItemMenu :items="spaceActions(space)" />
					</template>

					<template v-for="tag in unpinnedTags" :key="tag.id" #[`tag-${tag.id}-trailing`]>
						<NoteSidebarItemMenu :items="tagActions(tag)" />
					</template>
				</UNavigationMenu>
			</div>
		</UContextMenu>
	</LayoutSidebar>
</template>
