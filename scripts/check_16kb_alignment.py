"""Refuse to ship native libraries that cannot run on a 16 KB page size device.

Play reports this as "Does not support 16 KB" in the bundle explorer, long after the upload
has gone through — the first version of HivePulse reached Google's review with a CameraX
library aligned to 4 KB and nothing stopped it. This runs before the upload instead.

Only 64-bit ABIs are checked: 16 KB pages exist on arm64-v8a and x86_64, while the 32-bit
ABIs keep 4 KB and are not subject to the requirement.

Usage:
    python scripts/check_16kb_alignment.py path/to/app-release.aab
"""
import struct
import sys
import zipfile

PAGE_SIZE = 16 * 1024
SIXTY_FOUR_BIT_ABIS = ("arm64-v8a", "x86_64")
PT_LOAD = 1


def smallest_load_alignment(elf: bytes) -> int | None:
    """The smallest p_align over the loadable segments, or None if this is not a 64-bit ELF."""
    if elf[:4] != b"\x7fELF" or elf[4] != 2:
        return None

    program_header_offset = struct.unpack_from("<Q", elf, 0x20)[0]
    entry_size = struct.unpack_from("<H", elf, 0x36)[0]
    entry_count = struct.unpack_from("<H", elf, 0x38)[0]

    alignments = []
    for i in range(entry_count):
        entry = program_header_offset + i * entry_size
        if struct.unpack_from("<I", elf, entry)[0] == PT_LOAD:
            alignments.append(struct.unpack_from("<Q", elf, entry + 0x30)[0])
    return min(alignments) if alignments else None


def main(path: str) -> int:
    checked, failures = 0, []

    with zipfile.ZipFile(path) as bundle:
        for name in sorted(bundle.namelist()):
            if not name.endswith(".so") or not any(abi in name for abi in SIXTY_FOUR_BIT_ABIS):
                continue
            alignment = smallest_load_alignment(bundle.read(name))
            checked += 1
            if alignment is None:
                failures.append(f"{name}: not a 64-bit ELF, but sits in a 64-bit folder")
            elif alignment < PAGE_SIZE:
                failures.append(f"{name}: aligned to {alignment} B, needs {PAGE_SIZE} B")

    if checked == 0:
        # Better to say so than to pass silently on a path that held nothing.
        print(f"No 64-bit native libraries found in {path} — nothing was verified.")
        return 1

    for failure in failures:
        print(f"  {failure}")
    if failures:
        print(
            f"\n{len(failures)} of {checked} native libraries cannot run on a 16 KB page size.\n"
            "Update the dependency that ships them; Play rejects or flags the bundle otherwise."
        )
        return 1

    print(f"All {checked} 64-bit native libraries support 16 KB pages.")
    return 0


if __name__ == "__main__":
    if len(sys.argv) != 2:
        print(__doc__)
        sys.exit(2)
    sys.exit(main(sys.argv[1]))
