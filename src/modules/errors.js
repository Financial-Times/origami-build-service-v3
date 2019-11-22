/**
 * @class ArgumentError
 * @extends {Error}
 */
class ArgumentError extends Error {}

/**
 * @class StateError
 * @extends {Error}
 */
class StateError extends Error {}

/**
 * @class FormatError
 * @extends {Error}
 */
class FormatError extends Error {}

/**
 * @class PackageNotFoundError
 * @extends {Error}
 */
class PackageNotFoundError extends Error {}

/**
 * @class ApplicationError
 * @extends {Error}
 */
class ApplicationError extends Error {}

/**
 * @class UnsupportedError
 * @extends {Error}
 */
class UnsupportedError extends Error {}

/**
 * @class ManifestError
 * @extends {Error}
 */
class ManifestError extends Error {}

/**
 * @class UserError
 * @extends {Error}
 */
class UserError extends Error {}

/**
 * @class FileError
 * @extends {Error}
 */
class FileError extends Error {}

module.exports.ArgumentError = ArgumentError;
module.exports.StateError = StateError;
module.exports.FormatError = FormatError;
module.exports.PackageNotFoundError = PackageNotFoundError;
module.exports.ApplicationError = ApplicationError;
module.exports.UnsupportedError = UnsupportedError;
module.exports.ManifestError = ManifestError;
module.exports.UserError = UserError;
module.exports.FileError = FileError;
