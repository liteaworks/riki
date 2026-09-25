<script setup lang="ts">
import type { ContextMenuItem, DropdownMenuItem, NavigationMenuItem } from '@nuxt/ui'
import { LazyDialogModal, LazyNoteSpaceFormModal } from '#components'
import type { Space } from '#shared/types/note'
import type { SpaceListItem } from '#shared/types/space'

const { t } = useI18n()
const appConfig = useAppConfig()
const overlay = useOverlay()

const spaceStore = useSpaceStore()
const tagStore = useTagStore()
const { spaces } = storeToRefs(spaceStore)
const { tags } = storeToRefs(tagStore)

onMounted(() => {
	void spaceStore.load()
	void tagStore.load()
})

const spaceFormModal = overlay.create(LazyNoteSpaceFormModal)
const confirmDialog = overlay.create(LazyDialogModal)

const scope = ref<string>('library')
const contextSpaceId = ref<string | null>(null)

const contextSpace = computed(
	() => spaces.value.find((space) => space.id === contextSpaceId.value) ?? null,
)

function onSidebarContextMenu(event: MouseEvent) {
	const target = event.target
	if (!(target instanceof HTMLElement)) return
	contextSpaceId.value = target.closest<HTMLElement>('[data-space-id]')?.dataset.spaceId ?? null
}

function onSpaceSaved(space: Space) {
	if (spaces.value.some((item) => item.id === space.id)) spaceStore.renameSpace(space)
	else spaceStore.addSpace(space)
}

function openCreateSpace() {
	spaceFormModal.open({ space: null, onSaved: onSpaceSaved })
}

function openEditSpace(space: SpaceListItem) {
	spaceFormModal.open({ space, onSaved: onSpaceSaved })
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

function spaceActions(space: SpaceListItem): DropdownMenuItem[][] {
	return [
		[
			{
				label: t('common.edit'),
				icon: appConfig.ui.icons.edit,
				onSelect: () => openEditSpace(space),
			},
		],
		[
			{
				label: t('common.delete'),
				icon: appConfig.ui.icons.trash,
				color: 'error',
				onSelect: () => openDeleteSpace(space),
			},
		],
	]
}

const spaceContextItems = computed<ContextMenuItem[][]>(() =>
	contextSpace.value ? spaceActions(contextSpace.value) : [],
)

const items = computed<NavigationMenuItem[][]>(() => [
	[
		{
			label: t('layout.library'),
			icon: appConfig.ui.icons.file,
			active: scope.value === 'library',
			onSelect: () => {
				scope.value = 'library'
			},
		},
		{
			label: t('note.inbox'),
			icon: appConfig.ui.icons.inbox,
			active: scope.value === 'inbox',
			onSelect: () => {
				scope.value = 'inbox'
			},
		},
	],
	[
		{ label: t('space.label'), type: 'label', slot: 'spaces' },
		...spaces.value.map<NavigationMenuItem>((space) => ({
			label: space.name,
			icon: spaceStore.iconForSpace(space),
			active: scope.value === space.id,
			slot: `space-${space.id}`,
			'data-space-id': space.id,
			onSelect: () => {
				scope.value = space.id
			},
		})),
	],
	[
		{ label: t('tag.label'), type: 'label', slot: 'tags' },
		...tags.value.map<NavigationMenuItem>((tag) => ({
			label: tag.name,
			icon: appConfig.ui.icons.hash,
			active: scope.value === `tag:${tag.id}`,
			onSelect: () => {
				scope.value = `tag:${tag.id}`
			},
		})),
	],
])
</script>

<template>
	<LayoutSidebar>
		<UContextMenu :items="spaceContextItems" :disabled="!contextSpace">
			<div @contextmenu.capture="onSidebarContextMenu">
				<UNavigationMenu
					orientation="vertical"
					:items="items"
					:ui="{ link: 'overflow-hidden has-data-[state=open]:before:bg-elevated/50' }"
				>
					<template #spaces-trailing>
						<div
							class="pointer-events-none -my-0.5 -mr-1.5 flex opacity-0 transition-opacity group-hover/sidebar:pointer-events-auto group-hover/sidebar:opacity-100 group-data-[state=collapsed]/sidebar:hidden"
						>
							<UTooltip :text="t('space.new')">
								<UButton
									:icon="appConfig.ui.icons.plus"
									color="neutral"
									variant="ghost"
									size="xs"
									@click="openCreateSpace"
								/>
							</UTooltip>
						</div>
					</template>

					<template v-for="space in spaces" :key="space.id" #[`space-${space.id}-trailing`]>
						<div
							class="pointer-events-none -my-0.5 -mr-1.5 flex opacity-0 transition-opacity group-hover:pointer-events-auto group-hover:opacity-100 group-data-[state=collapsed]/sidebar:hidden has-data-[state=open]:opacity-100"
						>
							<UDropdownMenu
								:items="spaceActions(space)"
								:content="{ align: 'start' }"
								:modal="false"
							>
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
				</UNavigationMenu>
			</div>
		</UContextMenu>
	</LayoutSidebar>
</template>
