import { reportFailure } from '~/utils/failure-toast'

// `useI18n` needs a component instance, so stores must build the title from
// `$i18n` and call `reportFailure` directly instead of using this.
export function useFailureToast() {
	const { t } = useI18n()
	const toast = useToast()

	return function notifyFailure(action: string, error: unknown) {
		reportFailure(toast, t('common.actionFailed', { action }), error)
	}
}
