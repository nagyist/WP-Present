var WPPresentAdmin;
(function($) {

	WPPresentAdmin = function() {
		this.init();
		return this;
	}

	WPPresentAdmin.prototype = {
		init: function() {
			var self = this;
			var currentContainerWidth= $('#container').width();
			var columnWidth = 210;

			$( "#outer-container" ).resizable();

			$('#container').width( currentContainerWidth + columnWidth );
			$( "#container" ).sortable({
				stop: function() {
					self.updateTaxonomyDescription();
					self.updatePresentation();
				}
			});

			$( ".column-inner" ).sortable({
				connectWith: ".column-inner",
				stop: function() {
					self.updateTaxonomyDescription();
					self.updatePresentation();
				}
			});

			self.widgetButtonExpand();
			self.widgetButtonEdit();
			self.widgetButtonDelete();
			self.widgetButtonAdd();
			self.widgetButtonTidy();
			self.bindButtonAddColumn();
			self.bindButtonRemoveColumn();
			self.bindButtonViewPresentation();
			self.bindCloseModal();
			//self.backfillColumns();
			self.refreshUI();

			// Select the first column on load
			var $columnTitleBar = $('#col-1').children('.widget-top').children('.widget-title');
			self.activateColumn( $columnTitleBar );

			// Save it after the autopop if this is our first time
			if( '' == $('#description').val() ) {
				self.updateTaxonomyDescription();
				self.updatePresentation();
			}

			$('.spinner').hide();
			return self;
		},

		/**
		 * Sortables and such
		 */
		refreshUI: function () {
			var self = this;

			// Refresh the columns
			$( "#container" ).sortable("refresh");

			// TODO: Fixed outer containers resizable
			//$( "#outer-container" ).resizable("destroy");
			//$( "#outer-container" ).resizable();

			// Append an inner column to each column that doesn't contain any slides.
			$('.column' ).not(":has(div.column-inner)").append('<div class="column-inner ui-sortable"></div>');

			// This is a little bit of hackery.  It would be nice if the sortable("refresh") method worked here.
			// TODO: Investigate hackery
			if ($( '.column-inner' ).data( 'sortable' )) {
				$( ".column-inner" ).sortable("refresh");
			} else {
				$( ".column-inner" ).sortable({
					connectWith: ".column-inner",
					stop: function() {
						self.updateTaxonomyDescription();
						self.updatePresentation();
					}
				});
			}

			console.log( $('#wpbody-content') );
			$('#wpbody-content').on( 'click', '#name', function(e) {
				alert( 'toast' );
			});

			// This really should be called only once inside init
			self.enableColumns();
			self.renumberColumns();
		},

		/**
		 * Backfill Columns
		 */
		backfillColumns: function () {
			var self = this;
			var numSlides = WPPNumSlides[0];
			var numExisting = $('#container > .column').size();

			for (var col=numExisting+1;col<=numSlides;col++){
				self.addColumn();
			}
			//$('#container').append( '<div style="clear: both;"></div>' );
		},

		/**
		 * Make the column the target for adding new columns
		 */
		activateColumn: function ( $col ) {
			// TODO: cache widget-title
			// Remove the active class from all columns
			var $widgetTitle = $('.widget-title');
			$widgetTitle.css({ 'background' : '', 'color' : '' });
			$widgetTitle.removeClass('active');

			// Select the given column
			$col.css({ 'background-color' : '#0074a2', 'color' : '#ffffff' });
			$col.addClass('active');
		},

		/**
		 * Encode,update, and save the columns data into the hidden taxonomy description field
		 */
		updateTaxonomyDescription: function () {
			var self = this;
			var columns = { }; // Creates a new object
			var i = 1;
			$( '.column-inner' ).each( function() {
				var $order = $(this).sortable( "toArray" );
				columns['col-'+i] = $order;
				i++;
			});
			var encoded = JSON.stringify( columns );
			$('#description').val(encoded);

			// This was a convient time to do this UI clean-up
			self.renumberColumns();

			// Send this change off to ajax land
			self.updatePresentation();
		},

		/**
		 * AJAX request to update the current presentation taxonomy
		 */
		updatePresentation: function () {
			var nonce = $('#wp-present-nonce').val();
			var params = { 'content':$('#description').val(), 'id':presentation, 'nonce':nonce };
			$.ajax({
				url: ajaxurl + '?action=update_presentation',
				type: 'POST',
				data: jQuery.param(params),
				beforeSend: function() {
					$('.spinner').show();
				},
				complete: function() {
					//$('.spinner').hide();
				},
				success: function() {
					$('.spinner').hide();
				}
			});
		},

		/**
		 * Bind Tidy button (unused)
		 */
		widgetButtonTidy: function () {
			$('.action-buttons').on('click', '#tidy-button', function(e) {
				e.preventDefault();
				this.consolidateColumns();
				// Why does this break?
				//updatePresentation();
			});
		},

		/**
		 * Expand slide details
		 */
		widgetButtonExpand: function () {
			$('#container').on('click', '.widget-title-action', function() {
				$( this ).parents('.widget').children('.widget-inside').toggle();
			});
		},

		/**
		 * The action taken by the Tidy button (unused)
		 */
		consolidateColumns: function () {
			var self = this;
			var numCols = $('.column').length;

			$('.column').each(function(outerIndex){

				// Don't have a col 0
				var outerIndex = outerIndex + 1;

				// Fixes the condition where we are looking at the last item
				if( outerIndex >= numCols )
					return;

				var $outerCol = $(this);
				var $innerCol = $outerCol.children('.column-inner');

				var innerHTML = $innerCol.html().trim();
				var outerHTML = $outerCol.html().trim();

				if( typeof(innerHTML) !== 'string' || '' == innerHTML ) {
					var $nextOuterCol = $('#col-'+(outerIndex+1));
					var nextOuterHTML = $nextOuterCol.html().trim();

					$outerCol.html(nextOuterHTML);
					$nextOuterCol.html(outerHTML);
				}
			} );

			//Finally refresh description array
			$( ".column-inner" ).sortable({
				connectWith: ".column-inner",
				stop: ( function() {
					self.updateTaxonomyDescription();
				}),
				create: ( function() {
					self.updateTaxonomyDescription();
				})
			});
			self.updateTaxonomyDescription();
		},

		/**
		 * Setup the column to allow for activation
		 */
		enableColumns: function () {
			var self = this;
			$('.column').children('.widget-top').on('click', '.widget-title', function() {
				var $col = $(this);
				self.activateColumn( $col );
			});
		},

		/**
		 * Setup the slide 'Edit' links
		 */
		widgetButtonEdit: function () {
			var self = this;
			var $editorIframe = $('#editor_slide_ifr').contents();

			$('#container').on('click', '.widget-control-edit', function(e) {
				e.preventDefault();
				var $button = $(this);
				var $parentWidget = $button.parents('.widget');
				var $widgetPreview = $parentWidget.find('.widget-preview');
				var $widgetTitle = $parentWidget.find( '.widget-title h4' );

				// Send the contents from the widget to the editor
				var widgetID = $parentWidget.find('.slide-id').val();
				var nonce = $('#wp-present-nonce').val();

				$('#editor_slide-tmce').click(); //Necessary on subsequent loads of the editor

				// Clear the form out before we show it
				self.resetModal();

				$( "#dialog" ).dialog({
					autoOpen: true,
					modal: true,
					closeOnEscape: true,
					resizable: false,
					dialogClass: 'media-modal',
					buttons: {
						"Update": {
							class: 'button button-primary',
							text: 'Update',
							click: function() {
								var editorContents = tinymce.get('editor_slide').getContent();
								var postTitle = $( '#slide-title' ).val();
								var params = { 'id':widgetID, 'content':editorContents, 'title':postTitle, 'nonce':nonce };
								// Send the contents of the existing post
								$.ajax({
									url: ajaxurl + '?action=update_slide',
									type: 'POST',
									data: jQuery.param(params),
									beforeSend: function() {
										$('.spinner').show();
									},
									complete: function() {
										//$('.spinner').hide();
									},
									success: function(result) {
										$('.spinner').hide();
										// Return the excerpt from the editor
										$widgetPreview.html( result );
										$widgetTitle.text( postTitle );

									}
								});
								self.closeModal();
							}
						},
						Cancel: {
							class: 'button',
							text: 'Cancel',
							click: function() {
								self.closeModal();
							}
						},
					},
					create: function() {
						tinymce.execCommand('mceRemoveControl',true,'editor_slide');
						tinymce.execCommand('mceAddControl',true,'editor_slide');
					},
					open: function() {
						//$( ".ui-dialog" ).removeClass( 'ui-dialog' );

						// Load the contents of the existing post
						var nonce = $('#wp-present-nonce').val();
						var params = { 'id':widgetID, 'nonce':nonce };
						$.ajax({
							url: ajaxurl + '?action=get_slide',
							data: jQuery.param(params),
							beforeSend: function() {
								$('.spinner').show();
							},
							complete: function() {
								$('.spinner').hide();
							},
							success: function( contentEditor ) {
								var slide = jQuery.parseJSON( contentEditor );
								tinymce.get( 'editor_slide' ).setContent( slide.post_content );
								$( '#slide-title' ).val( slide.post_title );
								$( '#slide-slug' ).val( slide.post_name );
								$('.theme-name').html( slide.post_title );
								// Set tinymce background image
								var frameBackgroundImage = "url(" + slide.post_thumbnail_url + ")";
								$editorIframe.contents().find('.reveal').css( 'background-image' , frameBackgroundImage ).css( 'background-size', 'cover' );

								// This has to be the most hacky thing in this entire project
								self.resizeModal();
							}
						});

						// Hack for getting the reveal class added to tinymce editor body
						// @todo: look at wp_editor in wp/inc/class-wp-editor.php
						var $editorIframe = $('#editor_slide_ifr').contents();
						$editorIframe.find('body').addClass('reveal');
						$editorIframe.css('height','500px');

					},
					close: {
						class: 'button',
						click: function() {
							self.closeModal();
						}
					}
				});
			});
		},

		// Bind Delete button
		widgetButtonDelete: function () {
			var self = this;
			$('#container').on('click', '.widget-control-remove', function(e) {
				e.preventDefault();

				var confirmDelete = confirm("You are about to permanently delete the selected slide. 'Cancel' to stop, 'OK' to delete.");
				if( false === confirmDelete )
					return;

				var $button = $(this);
				var $parentWidget = $button.parents('.widget');
				var widgetID = $parentWidget.find('.slide-id').val();
				var nonce = $('#wp-present-nonce').val();
				var params = { 'id':widgetID, 'nonce':nonce };

				$.ajax({
					url: ajaxurl + '?action=delete_slide',
					type: 'POST',
					data: jQuery.param(params),
					beforeSend: function() {
						$('.spinner').show();
					},
					complete: function() {
						//$('.spinner').hide();
					},
					success: function() {
						$('.spinner').hide();
						$parentWidget.remove();
						self.updateTaxonomyDescription();
					}
				});
			});
		},

		// Bind Add button
		widgetButtonAdd: function () {
			var self = this;
			$('.action-buttons').on('click', '#add-button', function(e) {
				e.preventDefault();
				var $activeColumn = $('.widget-title.active').parent('.widget-top').parent('.column').children('.column-inner');
				var nonce = $('#wp-present-nonce').val();

				$('#editor_slide-tmce').click(); //Necessary on subsequent loads of the editor

				// Clear the form out before we show it
				self.resetModal();

				$( "#dialog" ).dialog({
					autoOpen: true,
					modal: true,
					closeOnEscape: true,
					resizable: false,
					dialogClass: 'media-modal',
					buttons: {
						"Publish": {
							class: 'button button-primary',
							text: 'Publish',
							click: function() {
								var editorContents = tinymce.get('editor_slide').getContent();
								var postTitle = $( '#slide-title' ).val();
								var params = { content:editorContents, 'presentation':presentation, 'title':postTitle,'nonce':nonce };

								$.ajax({
									url: ajaxurl + '?action=new_slide',
									type: 'POST',
									data: jQuery.param(params),
									success: function(result) {
										$activeColumn.append(result);
										WPPNumSlides[0]++;
										self.refreshUI();
										self.updateTaxonomyDescription();
								  }
								});
								self.closeModal();
							},
						},
						Cancel: {
							class: 'button',
							text: 'Cancel',
							click: function() {
								self.closeModal();
							}
						},
					},
					create: function() {
						// Re-init tinymce so the modal doesn't flip out
						tinymce.execCommand('mceRemoveControl',true,'editor_slide');
						tinymce.execCommand('mceAddControl',true,'editor_slide');
					},
					open: function() {
						// Clear the editor
						tinymce.get('editor_slide').setContent('');
						// Hack for getting the reveal class added to tinymce editor body
						var $editorIframe = $('#editor_slide_ifr').contents();
						$editorIframe.find('body').addClass('reveal');

						self.resizeModal();
					},
					close: {
						class: 'button',
						click: function() {
							self.closeModal();
						}
					}
				});
			});
		},

		// Adds a column to the presentation
		addColumn: function () {
			// TODO: I would be better if the column has the active class instead of the child elements

			var self = this;
			var col = $('#container > .column').size() + 1;
			var currentContainerWidth= $('#container').width();
			var columnWidth = 210;

			// TODO: Insert column after the active column as opposed to the end
			//var $activeColumn = $('.widget-title.active').parent('.widget-top').parent('.column').children('.column-inner');

			//$('#container').append( '<div class="column ui-sortable" id="col-'+col+'"><div class="widget-top"><div class="widget-title"><h4 class="hndle">'+col+'<span class="in-widget-title"></span></h4></div></div></div>' );
			$('.widget-title.active').parent('.widget-top').parent('.column').after( '<div class="column ui-sortable" id="col-'+col+'"><div class="widget-top"><div class="widget-title"><h4 class="hndle">'+col+'<span class="in-widget-title"></span></h4></div></div></div>' );

			$('#container').width( currentContainerWidth + columnWidth );
			self.renumberColumns();
		},

		// Adds a column to the presentation
		removeColumn: function () {
			// TODO: I would be better if the column has the active class instead of the child elements

			var confirmRemove = confirm("You are about to permanently delete the selected column. 'Cancel' to stop, 'OK' to delete.");
			if( false === confirmRemove )
				return;

			var self = this;
			var currentContainerWidth= $('#container').width();
			var columnWidth = 210;

			$('.widget-title.active').parent('.widget-top').parent('.column').remove();

			$('#container').width( currentContainerWidth - columnWidth );
			self.renumberColumns();

			// Activate the first column
			var $columnTitleBar = $('#col-1').children('.widget-top').children('.widget-title');
			self.activateColumn( $columnTitleBar );
		},

		//Bind Add Column button to addColumn()
		bindButtonAddColumn: function () {
			var self = this;
			$('.action-buttons').on('click', '#add-column', function(e) {
				e.preventDefault();
				self.addColumn();
				self.refreshUI();
				self.updateTaxonomyDescription();
				self.updatePresentation();
			});
		},

		//Bind Remove Column button to removeColumn()
		bindButtonRemoveColumn: function () {
			var self = this;
			$('.action-buttons').on('click', '#remove-column', function(e) {
				e.preventDefault();
				self.removeColumn();
				self.refreshUI();
				self.updateTaxonomyDescription();
				self.updatePresentation();
			});
		},

		//Bind View Presentation button
		bindButtonViewPresentation: function () {
			$('.action-buttons').on('click', '#view-button', function(e) {
				e.preventDefault();
				window.open(WPPTaxonomyURL,'_blank');
			});
		},

		renumberColumns: function() {
			var i = 1;
			$( '.column' ).each( function() {
				 var self = this;
				 var $self = $(self);
				 $self.find('> .widget-top > .widget-title > h4').html( i );
				i++;
			});
		},

		loadModalBackground: function() {
			var self = this;
		},

		/**
		 * Close Modal
		 */
		closeModal: function() {
			var self = this;
			self.resetModal();
			tinymce.execCommand('mceRemoveControl',true,'editor_slide');
			$( '#dialog' ).dialog( "close" );
		},

		/**
		 * Reset Modal
		 */
		resetModal: function() {
			// Make existing content go away
			$( '#slide-title' ).val( '' );
			$( '#slide-slug' ).val( '' );
		},

		/**
		 * Bind Close Modal Button
		 */
		bindCloseModal: function() {
			var self = this;
			$('.media-modal').on('click', '.media-modal-close', function(e) {
				e.preventDefault();
				self.closeModal();
			});
		},

		resizeModal: function() {
			// Set tinymce background image
			var $editorIframe = $( '#editor_slide_ifr' );
			var resize = $('.modal-inner-right' ).height() - 110;
			$editorIframe.height( resize );


			// This has to be the most hacky thing in this entire project
			var $editor = $editorIframe.contents().find('body.mceContentBody.reveal');
			var editorHeightBefore = Math.round( $editor.height() );
			var zoom = 0.6;

			$editor.css( 'display', 'table' );
			var editorHeightAfter = Math.round( $editor.height() );

			console.log( 'Before: ' + editorHeightBefore );
			console.log( 'After: ' + editorHeightAfter );
			var topMiddle = Math.round( ( editorHeightBefore - editorHeightAfter ) );
			console.log( 'Diff: ' + topMiddle );

			// Act on said hackiness
			$editor.css( 'padding-top', topMiddle );
			$editor.css( 'display', 'block' );
		}
	};

})(jQuery);
var slideManager = new WPPresentAdmin();