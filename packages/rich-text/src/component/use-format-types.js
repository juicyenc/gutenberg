/**
 * WordPress dependencies
 */
import { useSelect, __unstableUseDispatchWithMap } from '@wordpress/data';

function formatTypesSelector( select ) {
	return select( 'core/rich-text' ).getFormatTypes();
}

/**
 * This hook provides RichText with the `formatTypes` and its derived props from
 * experimental format type settings.
 *
 * @param {Object} $0            Options
 * @param {string} $0.clientId   Block client ID.
 * @param {string} $0.identifier Block attribute.
 */
export function useFormatTypes( { clientId, identifier } ) {
	const formatTypes = useSelect( formatTypesSelector, [] );
	const keyedSelected = useSelect(
		( select ) =>
			formatTypes.reduce( ( accumulator, type ) => {
				if ( type.__experimentalGetPropsForEditableTreePreparation ) {
					accumulator[
						type.name
					] = type.__experimentalGetPropsForEditableTreePreparation(
						select,
						{
							richTextIdentifier: identifier,
							blockClientId: clientId,
						}
					);
				}

				return accumulator;
			}, {} ),
		[ formatTypes, clientId, identifier ]
	);
	const keyedDispatchers = __unstableUseDispatchWithMap(
		( dispatch ) =>
			formatTypes.reduce( ( accumulator, type ) => {
				if ( type.__experimentalGetPropsForEditableTreeChangeHandler ) {
					accumulator[
						type.name
					] = type.__experimentalGetPropsForEditableTreeChangeHandler(
						dispatch,
						{
							richTextIdentifier: identifier,
							blockClientId: clientId,
						}
					);
				}

				return accumulator;
			}, {} ),
		[ formatTypes, clientId, identifier ]
	);

	const prepareHandlers = [];
	const valueHandlers = [];
	const changeHandlers = [];
	const dependencies = [];

	formatTypes.forEach( ( type ) => {
		if ( type.__experimentalCreatePrepareEditableTree ) {
			const selected = keyedSelected[ type.name ];
			const handler = type.__experimentalCreatePrepareEditableTree(
				selected,
				{
					richTextIdentifier: identifier,
					blockClientId: clientId,
				}
			);

			if ( type.__experimentalCreateOnChangeEditableValue ) {
				valueHandlers.push( handler );
			} else {
				prepareHandlers.push( handler );
			}

			for ( const key in selected ) {
				dependencies.push( selected[ key ] );
			}
		}

		if ( type.__experimentalCreateOnChangeEditableValue ) {
			changeHandlers.push(
				type.__experimentalCreateOnChangeEditableValue(
					{
						...( keyedSelected[ type.name ] || {} ),
						...( keyedDispatchers[ type.name ] || {} ),
					},
					{
						richTextIdentifier: identifier,
						blockClientId: clientId,
					}
				)
			);
		}
	} );

	return {
		formatTypes,
		prepareHandlers,
		valueHandlers,
		changeHandlers,
		dependencies,
	};
}