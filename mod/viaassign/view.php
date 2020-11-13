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
 * This file is the entry point to the viaassign module. All pages are rendered from here
 *
 * @package   mod_viaassign
 * @copyright 2012 NetSpot {@link http://www.netspot.com.au}
 * @license   http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

require_once('../../config.php');
require_once($CFG->dirroot . '/mod/viaassign/locallib.php');

$cmid = optional_param('cmid', 0, PARAM_INT);
$id = optional_param('id', 0, PARAM_INT);
if ($cmid != 0 && $id == 0) {
    $id = $cmid;
}

$urlparams = array('id' => $id,
                    'action' => optional_param('action', '', PARAM_TEXT),
                    'rownum' => optional_param('rownum', 0, PARAM_INT),
                    'useridlistid' => optional_param('action', 0, PARAM_INT),
                    'viaid' => optional_param('viaid', 0, PARAM_INT));

$url = new moodle_url('/mod/viaassign/view.php', $urlparams);
$cm = get_coursemodule_from_id('viaassign', $id, 0, false, MUST_EXIST);
$course = $DB->get_record('course', array('id' => $cm->course), '*', MUST_EXIST);

require_login($course, true, $cm);

$PAGE->set_url($url);
$PAGE->requires->jquery();
$PAGE->requires->js('/mod/via/javascript/mod_form.js', true);
$PAGE->requires->js('/mod/viaassign/yui/via_form.js', true);

$context = context_module::instance($cm->id);

require_capability('mod/viaassign:view', $context);

$viaassign = new viaassign($context, $cm, $course);

$completion = new completion_info($course);
$completion->set_module_viewed($cm);

// Get the viaassign class to render the page.
echo $viaassign->view(optional_param('action', '', PARAM_TEXT));