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
 * @package    local-mail
 * @copyright  Albert Gasset <albert.gasset@gmail.com>
 * @copyright  Marc Català <reskit@gmail.com>
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

$observers = array(
    array(
        'eventname' => 'core\event\course_module_completion_updated',
        'callback'  => 'local_myindex_observer::course_module_completion_updated',
    ),
    array(
        'eventname' => 'block_completion_progress\event\instance_deleted',
        'callback'  => 'local_myindex_observer::block_completion_progress_instance_deleted',
    ),
    array(
        'eventname' => 'core\event\course_deleted',
        'callback'  => 'local_myindex_observer::course_deleted',
    ),
    array(
        'eventname' => 'core\event\course_viewed',
        'callback'  => 'local_myindex_observer::course_viewed',
    ),
);
