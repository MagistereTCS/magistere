<?php
// This file is part of Moodle - http://moodle.org/
//
// Moodle is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// Moodle is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with Moodle.  If not, see <http://www.gnu.org/licenses/>.

/**
 * This file contains the functions for viaassign_plugin abstract class
 *
 *
 * @package   mod_viaassign
 * @copyright 2012 NetSpot {@link http://www.netspot.com.au}
 * @license   http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

defined('MOODLE_INTERNAL') || die();

/**
 * Abstract class for viaassign_plugin (submission/feedback).
 *
 * @package   mod_viaassign
 * @copyright 2012 NetSpot {@link http://www.netspot.com.au}
 * @license   http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
abstract class viaassign_plugin {
    /** @var viaassign $viaassignment the viaassignment record that contains the global
     *              settings for this viaassign instance
     */
    protected $viaassignment;
    /** @var string $type viaassignment plugin type */
    private $type = '';
    /** @var string $error error message */
    private $error = '';
    /** @var boolean|null $enabledcache Cached lookup of the is_enabled function */
    private $enabledcache = null;
    /** @var boolean|null $enabledcache Cached lookup of the is_visible function */
    private $visiblecache = null;

    /**
     * Constructor for the abstract plugin type class
     *
     * @param viaassign $viaassignment
     * @param string $type
     */
    public final function __construct(viaassign $viaassignment, $type) {
        $this->viaassignment = $viaassignment;
        $this->type = $type;
    }

    /**
     * Is this the first plugin in the list?
     *
     * @return bool
     */
    public final function is_first() {
        $order = get_config($this->get_subtype() . '_' . $this->get_type(), 'sortorder');

        if ($order == 0) {
            return true;
        }
        return false;
    }

    /**
     * Is this the last plugin in the list?
     *
     * @return bool
     */
    public final function is_last() {
        $lastindex = count(core_component::get_plugin_list($this->get_subtype())) - 1;
        $currentindex = get_config($this->get_subtype() . '_' . $this->get_type(), 'sortorder');
        if ($lastindex == $currentindex) {
            return true;
        }

        return false;
    }

    /**
     * This function should be overridden to provide an array of elements that can be added to a moodle
     * form for display in the settings page for the viaassignment.
     * @param MoodleQuickForm $mform The form to add the elements to
     * @return $array
     */
    public function get_settings(MoodleQuickForm $mform) {
        return;
    }

    /**
     * Allows the plugin to update the defaultvalues passed in to
     * the settings form (needed to set up draft areas for editor
     * and filemanager elements)
     * @param array $defaultvalues
     */
    public function data_preprocessing(&$defaultvalues) {
        return;
    }

    /**
     * The viaassignment subtype is responsible for saving it's own settings as the database table for the
     * standard type cannot be modified.
     *
     * @param stdClass $formdata - the data submitted from the form
     * @return bool - on error the subtype should call set_error and return false.
     */
    public function save_settings(stdClass $formdata) {
        return true;
    }

    /**
     * Save the error message from the last error
     *
     * @param string $msg - the error description
     */
    protected final function set_error($msg) {
        $this->error = $msg;
    }

    /**
     * What was the last error?
     *
     * @return string
     */
    public final function get_error() {
        return $this->error;
    }

    /**
     * Should return the name of this plugin type.
     *
     * @return string - the name
     */
    public abstract function get_name();

    /**
     * Should return the subtype of this plugin.
     *
     * @return string - 'feedback'
     */
    public abstract function get_subtype();

    /**
     * Should return the type of this plugin.
     *
     * @return string - the type
     */
    public final function get_type() {
        return $this->type;
    }

    /**
     * Get the installed version of this plugin
     *
     * @return string
     */
    public final function get_version() {
        $version = get_config($this->get_subtype() . '_' . $this->get_type(), 'version');
        if ($version) {
            return $version;
        } else {
            return '';
        }
    }

    /**
     * Get the required moodle version for this plugin
     *
     * @return string
     */
    public final function get_requires() {
        $requires = get_config($this->get_subtype() . '_' . $this->get_type(), 'requires');
        if ($requires) {
            return $requires;
        } else {
            return '';
        }
    }

    /**
     * Save any custom data for this form submission
     *
     * @param stdClass $submissionorgrade - viaassign_submission or viaassign_grade.
     *              For submission plugins this is the submission data,
     *              for feedback plugins it is the grade data
     * @param stdClass $data - the data submitted from the form
     * @return bool - on error the subtype should call set_error and return false.
     */
    public function save(stdClass $submissionorgrade, stdClass $data) {
        return true;
    }

    /**
     * Set this plugin to enabled
     *
     * @return bool
     */
    public final function enable() {
        $this->enabledcache = true;
        return $this->set_config('enabled', 1);
    }

    /**
     * Set this plugin to disabled
     *
     * @return bool
     */
    public final function disable() {
        $this->enabledcache = false;
        return $this->set_config('enabled', 0);
    }

    /**
     * Allows hiding this plugin from the submission/feedback screen if it is not enabled.
     *
     * @return bool - if false - this plugin will not accept submissions / feedback
     */
    public function is_enabled() {
        if ($this->enabledcache === null) {
            $this->enabledcache = $this->get_config('enabled');
        }
        return $this->enabledcache;
    }

    /**
     * Get any additional fields for the submission/grading form for this viaassignment.
     *
     * @param mixed $submissionorgrade submission|grade - For submission plugins this is the submission data,
     *                                                    for feedback plugins it is the grade data
     * @param MoodleQuickForm $mform - This is the form
     * @param stdClass $data - This is the form data that can be modified for example by a filemanager element
     * @param int $userid - This is the userid for the current submission.
     *                      This is passed separately as there may not yet be a submission or grade.
     * @return boolean - true if we added anything to the form
     */
    public function get_form_elements_for_user($submissionorgrade, MoodleQuickForm $mform, stdClass $data, $userid) {
        return $this->get_form_elements($submissionorgrade, $mform, $data);
    }

    /**
     * Get any additional fields for the submission/grading form for this viaassignment.
     * This function is retained for backwards compatibility - new plugins should override {@link get_form_elements_for_user()}.
     *
     * @param mixed $submissionorgrade submission|grade - For submission plugins this is the submission data,
     *                                                    for feedback plugins it is the grade data
     * @param MoodleQuickForm $mform - This is the form
     * @param stdClass $data - This is the form data that can be modified for example by a filemanager element
     * @return boolean - true if we added anything to the form
     */
    public function get_form_elements($submissionorgrade, MoodleQuickForm $mform, stdClass $data) {
        return false;
    }

    /**
     * Should not output anything - return the result as a string so it can be consumed by webservices.
     *
     * @param stdClass $submissionorgrade viaassign_submission or viaassign_grade
     *                 For submission plugins this is the submission data,
     *                 for feedback plugins it is the grade data
     * @return string - return a string representation of the submission in full
     */
    public function view(stdClass $submissionorgrade) {
        return '';
    }

    /**
     * Get the numerical sort order for this plugin
     *
     * @return int
     */
    public final function get_sort_order() {
        $order = get_config($this->get_subtype() . '_' . $this->get_type(), 'sortorder');
        return $order ? $order : 0;
    }

    /**
     * Is this plugin enaled?
     *
     * @return bool
     */
    public final function is_visible() {
        if ($this->visiblecache === null) {
            $disabled = get_config($this->get_subtype() . '_' . $this->get_type(), 'disabled');
            $this->visiblecache = !$disabled;
        }
        return $this->visiblecache;
    }

    /**
     * Has this plugin got a custom settings.php file?
     *
     * @return bool
     */
    public final function has_admin_settings() {
        global $CFG;

        $pluginroot = $CFG->dirroot . '/mod/viaassign/' .
                    substr($this->get_subtype(), strlen('viaassign')) . '/' . $this->get_type();
        $settingsfile = $pluginroot . '/settings.php';
        return file_exists($settingsfile);
    }

    /**
     * Set a configuration value for this plugin
     *
     * @param string $name The config key
     * @param string $value The config value
     * @return bool
     */
    public final function set_config($name, $value) {
        global $DB;

        $dbparams = array('viaassign' => $this->viaassignment->get_instance()->id,
                          'subtype' => $this->get_subtype(),
                          'plugin' => $this->get_type(),
                          'name' => $name);
        $current = $DB->get_record('viaassign_plugin_config', $dbparams, '*', IGNORE_MISSING);

        if ($current) {
            $current->value = $value;
            return $DB->update_record('viaassign_plugin_config', $current);
        } else {
            $setting = new stdClass();
            $setting->viaassign = $this->viaassignment->get_instance()->id;
            $setting->subtype = $this->get_subtype();
            $setting->plugin = $this->get_type();
            $setting->name = $name;
            $setting->value = $value;

            return $DB->insert_record('viaassign_plugin_config', $setting) > 0;
        }
    }

    /**
     * Get a configuration value for this plugin
     *
     * @param mixed $setting The config key (string) or null
     * @return mixed string | false
     */
    public final function get_config($setting = null) {
        global $DB;

        if ($setting) {
            if (!$this->viaassignment->has_instance()) {
                return false;
            }
            $viaassignment = $this->viaassignment->get_instance();
            if ($viaassignment) {
                $dbparams = array('viaassign' => $viaassignment->id,
                                  'subtype' => $this->get_subtype(),
                                  'plugin' => $this->get_type(),
                                  'name' => $setting);
                $result = $DB->get_record('viaassign_plugin_config', $dbparams, '*', IGNORE_MISSING);
                if ($result) {
                    return $result->value;
                }
            }
            return false;
        }
        $dbparams = array('viaassign' => $this->viaassignment->get_instance()->id,
                          'subtype' => $this->get_subtype(),
                          'plugin' => $this->get_type());
        $results = $DB->get_records('viaassign_plugin_config', $dbparams);

        $config = new stdClass();
        if (is_array($results)) {
            foreach ($results as $setting) {
                $name = $setting->name;
                $config->$name = $setting->value;
            }
        }
        return $config;
    }

    /**
     * Should not output anything - return the result as a string so it can be consumed by webservices.
     *
     * @param stdClass $submissionorgrade viaassign_submission or viaassign_grade
     *                 For submission plugins this is the submission data, for feedback plugins it is the grade data
     * @param bool $showviewlink Modifed to return whether or not to show a link to the full submission/feedback
     * @return string - return a string representation of the submission in full
     */
    public function view_summary(stdClass $submissionorgrade, & $showviewlink) {
        return '';
    }

    /**
     * Given a field name and value should update the text for this field in the plugins submission or grade
     *
     * @param string $name Name of the field.
     * @param string $value Updated text
     * @param int $submissionorgradeid The id of the submission or grade
     * @return bool - true if the value was updated
     */
    public function set_editor_text($name, $value, $submissionorgradeid) {
        return false;
    }

    /**
     * Given a field name and value should update the format for this field in the plugins submission or grade
     *
     * @param string $name Name of the field.
     * @param int $format Updated format.
     * @param int $submissionorgradeid The id of the submission or grade.
     * @return bool - true if the value was updated
     */
    public function set_editor_format($name, $format, $submissionorgradeid) {
        return false;
    }

    /**
     * Return a list of the fields that can be exported or imported via text.
     *
     * @return array - The list of field names (strings) and descriptions. ($name => $description)
     */
    public function get_editor_fields() {
        return array();
    }

    /**
     * Given a field name, should return the text of an editor field that is part of
     * this plugin. This is used when exporting to portfolio.
     *
     * @param string $name Name of the field.
     * @param int $submissionorgradeid The id of the submission or grade
     * @return string - The text for the editor field
     */
    public function get_editor_text($name, $submissionorgradeid) {
        return '';
    }

    /**
     * Produce a list of files suitable for export that represent this feedback or submission
     *
     * @param stdClass $submissionorgrade viaassign_submission or viaassign_grade
     *                 For submission plugins this is the submission data, for feedback plugins it is the grade data
     * @param stdClass $user The user record for the current submission.
     *                         Needed for url rewriting if this is a group submission.
     * @return array - return an array of files indexed by filename
     */
    public function get_files(stdClass $submissionorgrade, stdClass $user) {
        return array();
    }

    /**
     * Given a field name, should return the format of an editor field that is part of
     * this plugin. This is used when exporting to portfolio.
     *
     * @param string $name Name of the field.
     * @param int $submissionid The id of the submission
     * @return int - The format for the editor field
     */
    public function get_editor_format($name, $submissionid) {
        return 0;
    }

    /**
     * Return true if this plugin can upgrade an old Moodle 2.2 viaassignment of this type
     * and version.
     *
     * @param string $type The old viaassignment subtype
     * @param int $version The old viaassignment version
     * @return bool True if upgrade is possible
     */
    public function can_upgrade($type, $version) {
        return false;
    }

    /**
     * Upgrade the settings from the old viaassignment to the new one
     *
     * @param context $oldcontext The context for the old viaassignment module
     * @param stdClass $oldviaassignment The data record for the old viaassignment
     * @param string $log Record upgrade messages in the log
     * @return bool true or false - false will trigger a rollback
     */
    public function upgrade_settings(context $oldcontext, stdClass $oldviaassignment, & $log) {
        $params = array('type' => $this->type, 'subtype' => $this->get_subtype());
        $log .= ' ' . get_string('upgradenotimplemented', 'mod_viaassign', $params);
        return false;
    }

    /**
     * Upgrade the submission from the old viaassignment to the new one
     *
     * @param context $oldcontext The data record for the old context
     * @param stdClass $oldviaassignment The data record for the old viaassignment
     * @param stdClass $oldsubmissionorgrade The data record for the old submission
     * @param stdClass $submissionorgrade viaassign_submission or viaassign_grade The new submission or grade
     * @param string $log Record upgrade messages in the log
     * @return boolean true or false - false will trigger a rollback
     */
    public function upgrade(context $oldcontext,
                            stdClass $oldviaassignment,
                            stdClass $oldsubmissionorgrade,
                            stdClass $submissionorgrade,
                            & $log) {
        $params = array('type' => $this->type, 'subtype' => $this->get_subtype());
        $log = $log . ' ' . get_string('upgradenotimplemented', 'mod_viaassign', $params);
        return false;
    }

    /**
     * Formatting for log info
     *
     * @param stdClass $submissionorgrade viaassign_submission or viaassign_grade The new submission or grade
     * @return string
     */
    public function format_for_log(stdClass $submissionorgrade) {
        // Format the info for each submission plugin add_to_log.
        return '';
    }

    /**
     * The viaassignment has been deleted - remove the plugin specific data
     *
     * @return bool
     */
    public function delete_instance() {
        return true;
    }

    /**
     * Run cron for this plugin
     */
    public static function cron() {
    }

    /**
     * Is this viaassignment plugin empty? (ie no submission or feedback)
     * @param stdClass $submissionorgrade viaassign_submission or viaassign_grade
     * @return bool
     */
    public function is_empty(stdClass $submissionorgrade) {
        return true;
    }

    /**
     * Get file areas returns a list of areas this plugin stores files
     * @return array - An array of fileareas (keys) and descriptions (values)
     */
    public function get_file_areas() {
        return array();
    }

    /**
     * Default implementation of file_get_info for plugins.
     * This is used by the filebrowser to browse a plugins file areas.
     *
     * This implementation should work for most plugins but can be overridden if required.
     * @param file_browser $browser
     * @param string $filearea
     * @param int $itemid
     * @param string $filepath
     * @param string $filename
     * @return file_info_stored
     */
    public function get_file_info($browser, $filearea, $itemid, $filepath, $filename) {
        global $CFG, $DB, $USER;

        return null;

    }

    /**
     * This allows a plugin to render a page in the context of the viaassignment
     *
     * If the plugin creates a link to the viaassignment view.php page with
     * The following required parameters:
     *      id=coursemoduleid
     *      plugin=type
     *      pluginsubtype=viaassignfeedback|viaassignsubmission
     *      pluginaction=customaction
     *
     * Then this function will be called to display the page with the pluginaction passed as action
     * @param string $action The plugin specified action
     * @return string
     */
    public function view_page($action) {
        return '';
    }

    /**
     * This allows a plugin to render an introductory section which is displayed
     * right below the activity's "intro" section on the main viaassignment page.
     *
     * @return string
     */
    public function view_header() {
        return '';
    }

    /**
     * If this plugin should not include a column in the grading table or a row on the summary page
     * then return false
     *
     * @return bool
     */
    public function has_user_summary() {
        return true;
    }

    /**
     * If this plugin can participate in a webservice (save_submission or save_grade),
     * return a list of external_params to be included in the definition of that webservice.
     *
     * @return external_description|null
     */
    public function get_external_parameters() {
        return null;
    }

    /**
     * If true, the plugin will appear on the module settings page and can be
     * enabled/disabled per viaassignment instance.
     *
     * @return bool
     */
    public function is_configurable() {
        return true;
    }
}