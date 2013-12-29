<?php
/**
 ** WP Present Admin
 **
 ** @since 0.9.4
 **/
class WP_Present_Admin {

	const REVISION = 20131229;

	public $plugins_url = '';
	public $nonce_fail_message = '';

	// Define and register singleton
	private static $instance = false;
	public static function instance() {
		if( ! self::$instance ) {
			self::$instance = new self;
			self::$instance->setup();
		}
		return self::$instance;
	}

	/**
	 * Constructor
     *
	 * @since 0.9.0
	 */
	private function __construct() { }

	/**
	 * Clone
     *
	 * @since 0.9.0
	 */
	private function __clone() { }

	/**
	 * Add actions and filters
	 *
	 * @uses add_action, add_filter
	 * @since 0.9.5
	 */
	function setup() {

		// Setup
		$this->plugins_url = plugins_url( '/wp-present' );
		$this->nonce_fail_message = __( 'Cheatin&#8217; huh?' );

		// Admin
		add_action( 'admin_menu', array( $this, 'action_admin_menu' ) );
		add_action( 'admin_enqueue_scripts', array( $this, 'action_admin_enqueue_scripts' ) );
		add_action( 'admin_head', array( $this, 'action_admin_head' ), 20 );
		add_action( 'save_post', array( $this, 'action_save_post' ) );
		add_action( 'admin_footer', array( $this, 'action_admin_footer' ), 20 );

		add_filter( 'admin_body_class', array( $this, 'filter_admin_body_class' ) );

	}

	/**
	 * MP6 or bust.
	 *
	 * http://make.wordpress.org/ui/2013/11/19/targeting-the-new-dashboard-design-in-a-post-mp6-world/
	 *
	 * @since 0.9.5
	 */
	function filter_admin_body_class( $classes ) {
	    if ( version_compare( $GLOBALS['wp_version'], '3.8-alpha', '>' ) ) {
	        $classes = explode( " ", $classes );
	        if ( ! in_array( 'mp6', $classes ) ) {
	            $classes[] = 'mp6';
	        }
	        $classes = implode( " ", $classes );
	    }
	    return $classes;
	}

	/**
	 * Add the necessary menu pages
	 *
	 * @return null
	 */
	public function action_admin_menu(){
		global $menu, $submenu;

		// Taxonomy Menu
		$taxonomy_url = 'edit-tags.php?taxonomy=' . WP_Present_Core::TAXONOMY_SLUG . '&post_type='.WP_Present_Core::POST_TYPE_SLUG;
		$post_type_url = 'edit.php?post_type=' . WP_Present_Core::POST_TYPE_SLUG;


		// Add the options page
		add_submenu_page( $post_type_url, WP_Present_Core::OPTION_TITLE, 'Options', WP_Present_Core::CAPABILITY, WP_Present_Core::OPTION_NAME, array( $this, 'options_page' ) );

		// Rename the menu item
		foreach( $menu as $menu_key => $menu_item ) {
			if( WP_Present_Core::POST_TYPE_NAME == $menu_item[0] ) {
				$menu[ $menu_key ][0] = WP_Present_Core::TAXONOMY_NAME;
			}
		}

		// Move the taxonomy menu to the top
		// TODO: It would be better to search for the keys based on url
		foreach( $submenu as $submenu_key => $submenu_item ) {
			if( isset( $submenu_item[15][0] ) && WP_Present_Core::TAXONOMY_NAME == $submenu_item[15][0] ) {
				// This is a bit of hackery.  I should search for these keys
				$submenu[$submenu_key][2] = $submenu[$submenu_key][15];
				unset( $submenu[$submenu_key][15] );

				// Not a fan of the add new bit
				unset( $submenu[$submenu_key][10] );
				ksort( $submenu[$post_type_url] );
			}
		}
	}

	/**
	 * Markup for the Options page
	 *
	 * @return null
	 */
	public function options_page(){
		?>
		<div id="wpbody">
			<div id="wpbody-content" aria-label="Main content" tabindex="0">
				<div class="wrap">
					<?php //screen_icon(); ?>
					<h2><?php _e( 'Presentation Options', WP_Present_Core::TEXT_DOMAIN );?></h2>
					<div id="poststuff" class="metabox-holder has-right-sidebar">
						<div class="inner-sidebar" id="side-info-column">
							<div id="side-sortables" class="meta-box-sortables ui-sortable">
								<div id="wppresent_display_option" class="postbox ">
									<h3 class="hndle"><span><?php _e( 'Help Improve WP Present', WP_Present_Core::TEXT_DOMAIN );?></span></h3>
									<div class="inside">
										<p><?php _e( 'We would really appreciate your input to help us continue to improve the product.', WP_Present_Core::TEXT_DOMAIN );?></p>
										<p>
										<?php printf( __( 'Find us on %1$s or donate to the project using the button below.', WP_Present_Core::TEXT_DOMAIN ), '<a href="https://github.com/stevenkword/WP-Present" target="_blank">GitHub</a>' ); ?>
										</p>
										<div style="width: 100%; text-align: center;">
											<form action="https://www.paypal.com/cgi-bin/webscr" method="post" target="_blank">
												<input type="hidden" name="cmd" value="_s-xclick">
												<input type="hidden" name="hosted_button_id" value="6T4UQQXTXLKVW">
												<input type="image" src="https://www.paypalobjects.com/en_US/i/btn/btn_donate_LG.gif" border="0" name="submit" alt="PayPal - The safer, easier way to pay online!">
												<img alt="" border="0" src="https://www.paypalobjects.com/en_US/i/scr/pixel.gif" width="1" height="1">
											</form>
										</div>
									</div>
								</div>
								<div id="wppresent_display_contact" class="postbox ">
									<h3 class="hndle"><span><?php _e( 'Contact WP Present', WP_Present_Core::TEXT_DOMAIN );?></span></h3>
									<div class="inside">
										<ul class="wppresent-contact-links">
											<li><a class="link-wppresent-forum" href="http://wordpress.org/support/plugin/wp-present" target="_blank"><?php _e( 'Support Forums', WP_Present_Core::TEXT_DOMAIN );?></a></li>
											<li><a class="link-wppresent-web" href="http://stevenword.com/plugins/wp-present/" target="_blank"><?php _e( 'WP Present on the Web', WP_Present_Core::TEXT_DOMAIN );?></a></li>
											<li><a class="link-wppresent-github" href="https://github.com/stevenkword/WP-Present" target="_blank"><?php _e( 'GitHub Project', WP_Present_Core::TEXT_DOMAIN );?></a></li>
											<li><a class="link-wppresent-review" href="http://wordpress.org/support/view/plugin-reviews/wp-present" target="_blank"><?php _e( 'Review on WordPress.org', WP_Present_Core::TEXT_DOMAIN );?></a></li>
										</ul>
									</div>
								</div>
							</div>
						</div>
						<div id="post-body-content">
							<h2 class="nav-tab-wrapper" style="padding: 0;">
								<a href="#" class="nav-tab">General</a>
								<a href="#" class="nav-tab">Coming Soon</a>
								<a href="#" class="nav-tab">About</a>
							</h2>
							<h2><?php echo WP_Present_Core::OPTION_TITLE; ?></h2>
							<h3>Select a Theme</h3>
								<p>Current Theme: <?php echo WP_Present_Core::DEFAULT_THEME; ?></p>
							<h3>Resolution</h3>
								<p>1024x768</p>
							<h3>Branding</h3>
								<p><textarea>Branding HTML textarea goes here</textarea></p>
							<h3>Coming soon</h3>
								<?php
								//Get plugin path
								$plugin_path = dirname( dirname( __FILE__ ) );
								$master_plan_file = fopen( $plugin_path . '/master.plan', 'r' );
								while ( ! feof( $master_plan_file ) )
									echo fgets( $master_plan_file ) . '<br />';
								fclose( $master_plan_file );
								?>
						</div>
					</div>
				</div><!--/.wrap-->
				<div class="clear"></div>
			</div><!-- wpbody-content -->
			<div class="clear"></div>
		</div>
		<?php
	}

	/**
	 * Enqueue necessary admin scripts
	 *
	 * @uses wp_enqueue_script
	 * @return null
	 */
	public function action_admin_enqueue_scripts() {

		// Only add this variable on the edit taxonomy page
		global $pagenow;
		if( 'edit-tags.php' != $pagenow || ! isset( $_GET['taxonomy'] ) || WP_Present_Core::TAXONOMY_SLUG != $_GET['taxonomy'] || ! isset( $_GET['tag_ID'] ) )
			return;

		// Admin Styles
		wp_enqueue_style( 'wp-present-admin', $this->plugins_url . '/css/admin.css', '', self::REVISION );

		// Admin Scripts
		wp_enqueue_script( 'jquery-ui-sortable' );
		wp_enqueue_script( 'jquery-ui-resizable' );
		wp_enqueue_script( 'jquery-ui-dialog' );
		wp_enqueue_script( 'admin-widgets' );

		wp_enqueue_script( 'wp-present-admin', $this->plugins_url . '/js/admin.js', array( 'jquery' ), self::REVISION, true );

		//wp_enqueue_media();
		wp_enqueue_style( 'media-views' );

		if( isset( $_REQUEST['tag_ID'] ) )
			wp_localize_script( 'wp-present-admin', 'presentation', $_REQUEST['tag_ID'] );
	}

	/**
	 * Output for the admin <head>
	 *
	 * @return null
	 */
	public function action_admin_head() {

		// Presentation dashicon
	    echo '<style type="text/css">.mp6 #adminmenu #menu-posts-slide div.wp-menu-image:before { content: "\f181" !important; }</style>';

		// Only add this variable on the edit taxonomy page
		global $pagenow;
		if( 'edit-tags.php' != $pagenow || ! isset( $_GET['taxonomy'] ) || WP_Present_Core::TAXONOMY_SLUG != $_GET['taxonomy'] || ! isset( $_GET['tag_ID'] ) )
			return;

		$num_slides = ( isset( $_GET['tag_ID'] ) ) ? count( WP_Present_Core::get_associated_slide_ids( $_GET['tag_ID'], $_GET['taxonomy'] ) ) : '';

		$slides_query = new WP_Query( array(
			'post_type'     => WP_Present_Core::POST_TYPE_SLUG, //post type, I used 'product'
			'post_status'   => 'publish', // just tried to find all published post
			'posts_per_page' => -1,  //show all
			'tax_query' => array( array(
				'taxonomy' 	=> WP_Present_Core::TAXONOMY_SLUG,
				'terms'		=> $_GET['tag_ID']
			) )
		) );
		$num_slides = (int) $slides_query->post_count;
		unset( $slides_query );

		wp_localize_script( 'wp-present-admin', 'WPPNumSlides', array( intval( $num_slides ) ) );

		if( isset( $_REQUEST['tag_ID'] ) )
			wp_localize_script( 'wp-present-admin', 'WPPTaxonomyURL', array( get_term_link( (int) $_GET['tag_ID'], WP_Present_Core::TAXONOMY_SLUG ) ) );

		// Make the admin outer-container div big enough to prevent wrapping
		$column_width = 210;
		$container_size = ( $num_slides + 1 ) * $column_width;
		?>
		<style type="text/css">
			#container{ width: <?php echo $container_size; ?>px;}
		</style>
		<?php
		unset( $num_slides );
	}

	/*
	 * Save chosen primary presentaiton as post meta
	 * @param int $post_id
	 * @uses wp_verify_nonce, current_user_can, update_post_meta, delete_post_meta, wp_die
	 * @action save_post
	 * @return null
	 */
	public function action_save_post( $post_id ) {
		if ( defined( 'DOING_AUTOSAVE' ) && DOING_AUTOSAVE )
			return;

		// Broken
		//if ( ! isset( $_POST[ WP_Present_Core::NONCE_FIELD ] ) || ! wp_verify_nonce( $_POST[ WP_Present_Core::NONCE_FIELD ], WP_Present_Core::NONCE_FIELD ) )
			//return;

		if ( 'page' == get_post_type( $post_id ) && ! current_user_can( 'edit_page', $post_id ) )
				return;
		elseif ( ! current_user_can( 'edit_post', $post_id ) )
				return;

		//wp_die( 'You must choose a presentation', 'ERROR', array( 'back_link' => true ) );
	}

	/**
	 * Output for the admin <footer>
	 *
	 * @return null
	 */
	public function action_admin_footer() {
		// Only run on the edit taxonomy page
		global $pagenow;
		if( 'edit-tags.php' != $pagenow || ! isset( $_GET['taxonomy'] ) || WP_Present_Core::TAXONOMY_SLUG != $_GET['taxonomy'] )
			return;
	}


} // Class
WP_Present_Admin::instance();
