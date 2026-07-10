<?php
/**
 * Set Text Domain
 *
 * Replaces or adds text domain arguments in WordPress i18n function calls
 * using PHP's token_get_all() for proper AST-level parsing.
 *
 * Usage: php set-textdomain.php <arguments.json>
 *
 * The JSON file should contain:
 * - textdomain: (string) The text domain to set.
 * - files: (array) Absolute paths to PHP files to process.
 * - updateDomains: (array|true) Domains to replace, or true to replace all.
 *
 * @package ByteEver\Scripts
 */

// phpcs:ignoreFile

if ( 'cli' !== php_sapi_name() ) {
	exit( 1 );
}

if ( empty( $argv[1] ) || ! is_file( $argv[1] ) ) {
	fwrite( STDERR, "Usage: php set-textdomain.php <arguments.json>\n" );
	exit( 1 );
}

$args = json_decode( file_get_contents( $argv[1] ), true );

if ( json_last_error() !== JSON_ERROR_NONE ) {
	fwrite( STDERR, "Invalid JSON: " . json_last_error_msg() . "\n" );
	exit( 1 );
}

$textdomain     = $args['textdomain'] ?? '';
$files          = $args['files'] ?? array();
$update_domains = $args['updateDomains'] ?? array();

if ( empty( $textdomain ) || empty( $files ) ) {
	fwrite( STDERR, "Missing textdomain or files.\n" );
	exit( 1 );
}

/**
 * WordPress i18n functions and the position (1-based) of the text domain argument.
 */
$domain_positions = array(
	'__'           => 2,
	'_e'           => 2,
	'_x'           => 3,
	'_ex'          => 3,
	'_n'           => 4,
	'_nx'          => 5,
	'_n_noop'      => 3,
	'_nx_noop'     => 4,
	'esc_attr__'   => 2,
	'esc_html__'   => 2,
	'esc_attr_e'   => 2,
	'esc_html_e'   => 2,
	'esc_attr_x'   => 3,
	'esc_html_x'   => 3,
);

$func_names    = array_keys( $domain_positions );
$update_all    = ( true === $update_domains );
$changed_count = 0;

foreach ( $files as $file ) {
	if ( ! is_file( $file ) ) {
		continue;
	}

	$source   = file_get_contents( $file );
	$tokens   = token_get_all( $source );
	$output   = '';
	$modified = false;

	// State tracking.
	$in_func        = false;
	$current_func   = '';
	$parens_balance = 0;
	$args_started   = false;
	$found_domain   = false;
	$arg_position   = 0;

	foreach ( $tokens as $token ) {
		if ( is_array( $token ) ) {
			list( $id, $text ) = $token;
		} else {
			$id   = null;
			$text = $token;
		}

		// Detect i18n function call.
		if ( T_STRING === $id && in_array( $text, $func_names, true ) ) {
			$in_func        = true;
			$current_func   = $text;
			$parens_balance = 0;
			$args_started   = false;
			$found_domain   = false;
			$arg_position   = 0;
			$output        .= $text;
			continue;
		}

		if ( $in_func ) {
			// Opening parenthesis.
			if ( '(' === $text ) {
				++$parens_balance;
				if ( ! $args_started ) {
					$args_started = true;
					$arg_position = 1;
				}
				$output .= $text;
				continue;
			}

			// Closing parenthesis.
			if ( ')' === $text ) {
				--$parens_balance;
				if ( 0 === $parens_balance ) {
					// End of function call — inject domain if missing.
					if ( ! $found_domain ) {
						// Remove trailing whitespace before closing paren.
						$output   = rtrim( $output );
						$output  .= ", '" . addslashes( $textdomain ) . "' )";
						$modified = true;
					} else {
						$output .= $text;
					}
					$in_func = false;
					continue;
				}
				$output .= $text;
				continue;
			}

			// Comma at top level of this function call — increment arg position.
			if ( ',' === $text && 1 === $parens_balance ) {
				++$arg_position;
				$output .= $text;
				continue;
			}

			// Check for existing text domain string to replace.
			if ( T_CONSTANT_ENCAPSED_STRING === $id && $args_started && 1 === $parens_balance ) {
				$string_value = trim( $text, "\"'" );
				$target_pos   = $domain_positions[ $current_func ] ?? 0;

				// Replace if this argument is at the domain position.
				if ( $arg_position === $target_pos ) {
					$found_domain   = true;
					$should_replace = false;

					if ( $update_all ) {
						$should_replace = true;
					} elseif ( is_array( $update_domains ) && in_array( $string_value, $update_domains, true ) ) {
						$should_replace = true;
					}

					if ( $should_replace && $string_value !== $textdomain ) {
						$text     = "'" . addslashes( $textdomain ) . "'";
						$modified = true;
					}
				}
			}
		}

		$output .= $text;
	}

	if ( $modified ) {
		file_put_contents( $file, $output );
		++$changed_count;
	}
}

echo json_encode( array( 'changed' => $changed_count ) );
exit( 0 );