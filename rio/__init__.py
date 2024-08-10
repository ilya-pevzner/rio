__version__ = "0.9.3rc0"

import logging

_logger = logging.getLogger(__name__)

# Re-export dataclass stuff for easy use.
from dataclasses import KW_ONLY as KW_ONLY
from dataclasses import field as field

# URLs are used as an important datatype within rio. Re-export them for easy
# use.
from yarl import URL as URL

from . import event as event
from . import icons as icons  # For backwards compat. Delete eventually
from . import patches_for_3rd_party_stuff
from .app import *
from .color import *
from .components import *
from .cursor_style import *
from .dialog import *
from .errors import *
from .fills import *
from .routing import *
from .session import *
from .text_style import *
from .theme import *
from .user_settings_module import *
from .utils import *

del patches_for_3rd_party_stuff
