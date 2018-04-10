"""
Libraries of code use by data processor
"""
#pylint: disable=invalid-name
import math
import re

def parse_grid_reference(grid_reference):
    """
    Parses a grid reference e.g.
    parse_grid_reference('TG 51409 13177') == (651409, 313177)
    """
    # Standardise input
    grid_reference = re.sub(r"\s+", "", grid_reference).upper()

    if not re.match(r"^[A-Z]{2}[0-9]+$", grid_reference):
        raise ValueError("Invalid grid reference")

    # get numeric values of letter references, mapping A->0, B->1, C->2, etc:
    l1 = ord(grid_reference[0]) - ord("A")
    l2 = ord(grid_reference[1]) - ord("A")

    # shuffle down letters after 'I' since 'I' is not used in grid:
    if l1 > 7:
        l1 -= 1
    if l2 > 7:
        l2 -= 1

    # convert grid letters into 100km-square indexes from false origin (grid square SV):
    e100km = ((l1-2)%5)*5 + (l2%5)
    n100km = (19-math.floor(l1/5)*5) - math.floor(l2/5)

    if e100km < 0 or e100km > 6 or n100km < 0 or n100km > 12:
        raise ValueError('Grid reference outside UK')

    # skip grid letters to get numeric (easting/northing) part of ref
    en = grid_reference[2:]
    if len(en) % 2 != 0:
        raise ValueError('Grid reference must have even number of digits')

    # slice into two
    half_length = int(len(en)/2)
    easting, northing = en[:half_length], en[half_length:]

    # standardise to 10-digit refs (metres)
    easting = e100km*100000 + int((easting+'00000')[:5])
    northing = n100km*100000 + int((northing+'00000')[:5])
    return (easting, northing)


def make_grid_reference(vector, digits):
    """
    Turns easting northings into a grid reference
    """
    (eastings, northings) = vector

    if digits%2 != 0 or digits < 0 or digits > 16:
        raise ValueError('Invalid precision ‘'+digits+'’')

    # Get the 100km-grid indices
    e100k = math.floor(eastings/100000)
    n100k = math.floor(northings/100000)

    if e100k < 0 or e100k > 6 or n100k < 0 or n100k > 12:
        raise ValueError("Co-ordinates are not within UK National Grid")

    # Translate those into numeric equivalents of the grid letters
    number1 = (19-n100k) - (19-n100k)%5 + math.floor((e100k+10)/5)
    number2 = (19-n100k)*5%25 + e100k%5
    grid_square = ''.join((number_to_letter(number1), number_to_letter(number2)))

    # Strip 100km-grid indices from easting & northing, and reduce precision
    digits = int(digits/2)
    eastings = math.floor((eastings%100000)/math.pow(10, 5-digits))
    northings = math.floor((northings%100000)/math.pow(10, 5-digits))

    # Pad eastings & northings with leading zeros (just in case, allow up to 16-digit (mm) refs)
    eastings_string = str(eastings).zfill(digits)
    northings_string = str(northings).zfill(digits)
    return "{}{}{}".format(grid_square, eastings_string, northings_string)


def number_to_letter(n):
    """
    Converts grid number to letter
    """
    # Compensate for skipped 'I' and build grid letter-pairs
    if n > 7:
        n += 1
    return chr(n+65)


def get_neighbor(grid_reference, x, y):
    """
    Gets the neighbor of the reference, x and y squares away
    """
    grid_reference = re.sub(r"\s+", "", grid_reference).upper()
    if not re.match(r"^[A-Z]{2}[0-9]{2}$", grid_reference):
        raise ValueError("Invalid grid reference")

    (easting, northing) = parse_grid_reference(grid_reference)
    easting += 10000 * x
    northing += 10000 * y

    return make_grid_reference((easting, northing), 2)

if __name__ == "__main__":

    assert parse_grid_reference("NT27") == (320000, 670000)
    assert make_grid_reference((320000, 670000), 2) == "NT27"

    assert number_to_letter(0) == "A"
    assert number_to_letter(24) == "Z"

    assert get_neighbor("NT99", 1, 0) == "NU09"
    assert get_neighbor("NT99", 0, 1) == "NO90"
    assert get_neighbor("NT99", 1, 1) == "NP00"
