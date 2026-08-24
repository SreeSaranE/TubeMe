using System.Collections.Generic;
using Microsoft.AspNetCore.Mvc;
using YoutubeDownloader.Models;
using YoutubeDownloader.Services.Interfaces;

namespace YoutubeDownloader.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class FilesController : ControllerBase
    {
        private readonly IMediaFileService _mediaFileService;

        public FilesController(IMediaFileService mediaFileService)
        {
            _mediaFileService = mediaFileService;
        }

        [HttpGet]
        public ActionResult<List<FileInfoItem>> GetFiles([FromQuery] string? subDir)
        {
            return Ok(_mediaFileService.GetMediaFiles(subDir));
        }
    }
}
