<script setup lang="ts">
import type { DropdownMenuItem } from '@nuxt/ui'
import { noteVisibilityValues } from '#shared/types/note'
import { noteVisibilityMeta } from '~/utils/note-visibility'

const { t } = useI18n()
const appConfig = useAppConfig()
const noteStore = useNoteStore()
const tagStore = useTagStore()

const expanded = ref(false)

const activeCount = computed(
	() =>
		noteStore.visibilityFilter.length +
		noteStore.tagFilter.length +
		(noteStore.pinnedOnly ? 1 : 0) +
		(noteStore.keyword.trim() ? 1 : 0),
)

const filterItems = computed<DropdownMenuItem[][]>(() => [
	[
		{
			label: t('note.visibilityLabel'),
			icon: appConfig.ui.icons.globe,
			children: [
				noteVisibilityValues.map((value) => ({
					type: 'checkbox' as const,
					label: t(noteVisibilityMeta[value].label),
					icon: appConfig.ui.icons[noteVisibilityMeta[value].icon],
					checked: noteStore.visibilityFilter.includes(value),
					onUpdateChecked: () => {
						noteStore.visibilityFilter = noteStore.visibilityFilter.includes(value)
							? noteStore.visibilityFilter.filter((item) => item !== value)
							: [...noteStore.visibilityFilter, value]
					},
					onSelect: (event: Event) => event.preventDefault(),
				})),
			],
		},
		{
			label: t('view.tags'),
			icon: appConfig.ui.icons.hash,
			filter: {
				placeholder: t('common.searchLabelPlaceholder', { label: t('view.tags') }),
			},
			children: [
				tagStore.tags.map((tag) => ({
					type: 'checkbox' as const,
					label: tag.name,
					checked: noteStore.tagFilter.includes(tag.id),
					onUpdateChecked: () => {
						noteStore.tagFilter = noteStore.tagFilter.includes(tag.id)
							? noteStore.tagFilter.filter((id) => id !== tag.id)
							: [...noteStore.tagFilter, tag.id]
					},
					onSelect: (event: Event) => event.preventDefault(),
				})),
			],
		},
	],
	[
		{
			type: 'checkbox' as const,
			label: t('view.pinnedOnly'),
			icon: appConfig.ui.icons.pin,
			checked: noteStore.pinnedOnly,
			onUpdateChecked: (checked: boolean) => {
				noteStore.pinnedOnly = checked
			},
			onSelect: (event: Event) => event.preventDefault(),
		},
		{
			label: t('view.clearFilter'),
			icon: appConfig.ui.icons.close,
			disabled: !activeCount.value,
			onSelect: () => noteStore.resetFilter(),
		},
	],
])

function closeOnEmpty() {
	if (!noteStore.keyword) expanded.value = false
}
</script>

<template>
	<div class="flex items-center gap-1 px-2 py-1">
		<UInput
			v-if="expanded"
			:model-value="noteStore.keyword"
			:icon="appConfig.ui.icons.search"
			:placeholder="$t('common.searchPlaceholder')"
			color="neutral"
			variant="soft"
			class="max-w-xs flex-1"
			autofocus
			@update:model-value="noteStore.keyword = $event"
			@blur="closeOnEmpty"
		/>
		<div class="ms-auto flex items-center gap-1">
			<UTooltip :text="t('view.search')">
				<UButton
					:icon="appConfig.ui.icons.search"
					color="neutral"
					variant="ghost"
					:aria-label="t('view.search')"
					@click="expanded = !expanded"
				/>
			</UTooltip>
			<UDropdownMenu :items="filterItems" :content="{ align: 'end' }">
				<UTooltip :text="t('view.filter')">
					<UButton
						:icon="appConfig.ui.icons.filter"
						color="neutral"
						variant="ghost"
						:aria-label="t('view.filter')"
					>
						<template v-if="activeCount" #trailing>
							<UBadge :label="String(activeCount)" size="sm" variant="soft" />
						</template>
					</UButton>
				</UTooltip>
			</UDropdownMenu>
		</div>
	</div>
</template>
